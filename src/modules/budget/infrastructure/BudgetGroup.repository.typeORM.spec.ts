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
  let dataSource: jest.Mocked<Pick<DataSource, 'transaction' | 'query'>>;
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
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<BudgetGroupMemberEntity>>;
    manager = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Pick<EntityManager, 'save'>>;
    dataSource = {
      transaction: jest.fn(async (cb: (m: EntityManager) => Promise<unknown>) =>
        cb(manager as unknown as EntityManager),
      ),
      query: jest.fn(),
    } as unknown as jest.Mocked<Pick<DataSource, 'transaction' | 'query'>>;
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

  describe('isOwner', () => {
    it('retourne true si userId === group.ownerId', async () => {
      groupRepoTypeOrm.findOne.mockResolvedValueOnce({
        id: 'g1',
        ownerId: 'u1',
      } as BudgetGroupEntity);
      expect(await repo.isOwner('g1', 'u1')).toBe(true);
    });

    it('retourne false si userId !== group.ownerId', async () => {
      groupRepoTypeOrm.findOne.mockResolvedValueOnce({
        id: 'g1',
        ownerId: 'u-other',
      } as BudgetGroupEntity);
      expect(await repo.isOwner('g1', 'u1')).toBe(false);
    });

    it('retourne false si group inexistant', async () => {
      groupRepoTypeOrm.findOne.mockResolvedValueOnce(null);
      expect(await repo.isOwner('g-missing', 'u1')).toBe(false);
    });
  });

  describe('findMembersWithUsers', () => {
    it('retourne les membres avec isOwner correct (owner first)', async () => {
      dataSource.query.mockResolvedValueOnce([
        {
          user_id: 'owner-id',
          email: 'owner@x.fr',
          first_name: 'Alice',
          joined_at: new Date('2026-01-01'),
          is_owner: true,
        },
        {
          user_id: 'invited-id',
          email: 'bob@x.fr',
          first_name: 'Bob',
          joined_at: new Date('2026-02-01'),
          is_owner: false,
        },
      ]);
      const members = await repo.findMembersWithUsers('g1');
      expect(members).toHaveLength(2);
      expect(members[0]).toEqual({
        userId: 'owner-id',
        email: 'owner@x.fr',
        displayName: 'Alice',
        isOwner: true,
        joinedAt: new Date('2026-01-01'),
      });
      expect(members[1].isOwner).toBe(false);
    });

    it('retourne [] si aucun membre / group inexistant', async () => {
      dataSource.query.mockResolvedValueOnce([]);
      expect(await repo.findMembersWithUsers('g-missing')).toEqual([]);
    });

    it('displayName fallback sur email split si first_name null', async () => {
      dataSource.query.mockResolvedValueOnce([
        {
          user_id: 'u1',
          email: 'noname@x.fr',
          first_name: null,
          joined_at: new Date('2026-01-01'),
          is_owner: false,
        },
      ]);
      const members = await repo.findMembersWithUsers('g1');
      expect(members[0].displayName).toBe('noname');
    });

    it('passe le groupId en parametre $1 (anti SQL injection)', async () => {
      dataSource.query.mockResolvedValueOnce([]);
      await repo.findMembersWithUsers('g1');
      expect(dataSource.query).toHaveBeenCalledWith(expect.any(String), ['g1']);
    });
  });

  describe('removeMember', () => {
    it('appelle memberRepo.delete avec groupId+userId', async () => {
      (memberRepoTypeOrm as unknown as { delete: jest.Mock }).delete = jest
        .fn()
        .mockResolvedValueOnce({ affected: 1 });
      await repo.removeMember('g1', 'u-target');
      expect(
        (memberRepoTypeOrm as unknown as { delete: jest.Mock }).delete,
      ).toHaveBeenCalledWith({ groupId: 'g1', userId: 'u-target' });
    });

    it("idempotent : ne throw pas si la ligne n'existe pas", async () => {
      (memberRepoTypeOrm as unknown as { delete: jest.Mock }).delete = jest
        .fn()
        .mockResolvedValueOnce({ affected: 0 });
      await expect(
        repo.removeMember('g1', 'u-missing'),
      ).resolves.toBeUndefined();
    });
  });
});
