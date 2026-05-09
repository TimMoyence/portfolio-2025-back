import type { DataSource, EntityManager, Repository } from 'typeorm';
import { BudgetGroup } from '../domain/BudgetGroup';
import { BudgetGroupEntity } from './entities/BudgetGroup.entity';
import { BudgetGroupMemberEntity } from './entities/BudgetGroupMember.entity';
import { BudgetGroupRepositoryTypeORM } from './BudgetGroup.repository.typeORM';

/**
 * Spec P0-4 (audit 2026-05-09) : `BudgetGroupRepositoryTypeORM.create`
 * doit etre atomique. Avant le fix, group save + member save n'etaient
 * pas en transaction : si la 2eme save echouait, on avait un groupe
 * orphelin sans owner-membre (invariant casse).
 *
 * On mocke `DataSource.transaction` pour verifier que les deux saves
 * sont enveloppees, et qu'une erreur sur la 2eme save propage
 * l'exception (le rollback est garanti par TypeORM en runtime).
 */
describe('BudgetGroupRepositoryTypeORM — P0-4 transaction atomique', () => {
  let groupRepoTypeOrm: jest.Mocked<Repository<BudgetGroupEntity>>;
  let memberRepoTypeOrm: jest.Mocked<Repository<BudgetGroupMemberEntity>>;
  let manager: jest.Mocked<Pick<EntityManager, 'save'>>;
  let dataSource: jest.Mocked<Pick<DataSource, 'transaction'>>;
  let repo: BudgetGroupRepositoryTypeORM;

  beforeEach(() => {
    groupRepoTypeOrm = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<BudgetGroupEntity>>;
    memberRepoTypeOrm = {
      save: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<Repository<BudgetGroupMemberEntity>>;
    manager = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Pick<EntityManager, 'save'>>;
    dataSource = {
      transaction: jest.fn(async (cb: (m: EntityManager) => Promise<unknown>) =>
        cb(manager as unknown as EntityManager),
      ),
    } as unknown as jest.Mocked<Pick<DataSource, 'transaction'>>;
    repo = new BudgetGroupRepositoryTypeORM(
      groupRepoTypeOrm,
      memberRepoTypeOrm,
      dataSource as unknown as DataSource,
    );
  });

  it('devrait envelopper group save + member save dans une transaction', async () => {
    const savedGroup = {
      id: 'group-1',
      name: 'Mon budget',
      ownerId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as BudgetGroupEntity;
    manager.save.mockImplementationOnce(async () =>
      Promise.resolve(savedGroup),
    );
    manager.save.mockImplementationOnce(async () => Promise.resolve({}));

    const group = new BudgetGroup();
    group.name = 'Mon budget';
    group.ownerId = 'user-1';

    await repo.create(group);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.save).toHaveBeenCalledTimes(2);
    expect(manager.save).toHaveBeenNthCalledWith(
      1,
      BudgetGroupEntity,
      expect.objectContaining({ name: 'Mon budget', ownerId: 'user-1' }),
    );
    expect(manager.save).toHaveBeenNthCalledWith(
      2,
      BudgetGroupMemberEntity,
      expect.objectContaining({ groupId: 'group-1', userId: 'user-1' }),
    );
  });

  it('devrait propager l erreur si la 2eme save echoue (rollback)', async () => {
    manager.save
      .mockResolvedValueOnce({
        id: 'group-1',
        name: 'X',
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as BudgetGroupEntity)
      .mockRejectedValueOnce(new Error('FK constraint violation'));

    const group = new BudgetGroup();
    group.name = 'X';
    group.ownerId = 'user-1';

    await expect(repo.create(group)).rejects.toThrow('FK constraint violation');
    // dataSource.transaction est appele 1 fois — TypeORM rollback en
    // interne lorsque le callback rejette ; ce qui compte cote test
    // est que l'erreur ne soit PAS swallow.
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });
});
