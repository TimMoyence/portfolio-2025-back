import type { Repository } from 'typeorm';
import { BudgetMemberContributionEntity } from './entities/BudgetMemberContribution.entity';
import { BudgetMemberContributionRepositoryTypeORM } from './BudgetMemberContribution.repository.typeORM';

/**
 * Spec unit (Task 2.5 RED) : `BudgetMemberContributionRepositoryTypeORM`
 * doit implementer `IBudgetMemberContributionRepository` en s'appuyant
 * sur le `Repository<BudgetMemberContributionEntity>` TypeORM.
 *
 * Contrats valides ici (avant implementation — phase RED) :
 *   - `findByGroupAndPeriod` : where { groupId, month, year }, mapping decimal -> number.
 *   - `upsertForUser` : upsert avec conflict cols (groupId, userId, month, year)
 *     puis re-read via findOne pour retourner l'entite persistee mappee.
 *   - `findLastForUserBefore` : queryBuilder avec order desc (year, month) + limit 1.
 *
 * Style : mocks `Repository<...>` typees, identique a
 * `BudgetGroup.repository.typeORM.spec.ts` (DRY, pas de DB).
 */
describe('BudgetMemberContributionRepositoryTypeORM', () => {
  let entityRepo: jest.Mocked<Repository<BudgetMemberContributionEntity>>;
  let repo: BudgetMemberContributionRepositoryTypeORM;

  beforeEach(() => {
    entityRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      upsert: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<BudgetMemberContributionEntity>>;
    repo = new BudgetMemberContributionRepositoryTypeORM(entityRepo);
  });

  describe('findByGroupAndPeriod', () => {
    it('appelle find avec where { groupId, month, year } et retourne les contributions mappees', async () => {
      const entity = {
        id: 'c1',
        groupId: 'g1',
        userId: 'u1',
        month: 5,
        year: 2026,
        monthlySalary: '2500.00' as unknown as number, // string from PG decimal
        createdAt: new Date('2026-05-01'),
        updatedAt: new Date('2026-05-01'),
      } as BudgetMemberContributionEntity;
      entityRepo.find.mockResolvedValueOnce([entity]);

      const result = await repo.findByGroupAndPeriod('g1', 5, 2026);

      const findMock = entityRepo['find'] as unknown as jest.Mock;
      expect(findMock).toHaveBeenCalledWith({
        where: { groupId: 'g1', month: 5, year: 2026 },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'c1',
        groupId: 'g1',
        userId: 'u1',
        month: 5,
        year: 2026,
        monthlySalary: 2500,
      });
    });

    it('retourne [] si find retourne []', async () => {
      entityRepo.find.mockResolvedValueOnce([]);
      expect(await repo.findByGroupAndPeriod('g-missing', 5, 2026)).toEqual([]);
    });
  });

  describe('upsertForUser', () => {
    it('appelle upsert avec conflict cols (groupId,userId,month,year) puis retourne la contribution mise a jour', async () => {
      const persisted = {
        id: 'c1',
        groupId: 'g1',
        userId: 'u1',
        month: 5,
        year: 2026,
        monthlySalary: '3000.00' as unknown as number,
        createdAt: new Date('2026-05-01'),
        updatedAt: new Date('2026-05-02'),
      } as BudgetMemberContributionEntity;
      entityRepo.upsert.mockResolvedValueOnce({
        identifiers: [],
        generatedMaps: [],
        raw: [],
      } as never);
      entityRepo.findOne.mockResolvedValueOnce(persisted);

      const result = await repo.upsertForUser({
        groupId: 'g1',
        userId: 'u1',
        month: 5,
        year: 2026,
        monthlySalary: 3000,
      });

      const upsertMock = entityRepo['upsert'] as unknown as jest.Mock;
      const findOneMock = entityRepo['findOne'] as unknown as jest.Mock;
      expect(upsertMock).toHaveBeenCalledWith(
        {
          groupId: 'g1',
          userId: 'u1',
          month: 5,
          year: 2026,
          monthlySalary: 3000,
        },
        ['groupId', 'userId', 'month', 'year'],
      );
      expect(findOneMock).toHaveBeenCalledWith({
        where: { groupId: 'g1', userId: 'u1', month: 5, year: 2026 },
      });
      expect(result.monthlySalary).toBe(3000);
    });
  });

  describe('findLastForUserBefore', () => {
    it('utilise queryBuilder pour trouver la contribution la plus recente avant (year, month)', async () => {
      const entity = {
        id: 'c-prev',
        groupId: 'g1',
        userId: 'u1',
        month: 4,
        year: 2026,
        monthlySalary: '2400.00' as unknown as number,
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-01'),
      } as BudgetMemberContributionEntity;
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValueOnce(entity),
      };
      const createQbMock = entityRepo[
        'createQueryBuilder'
      ] as unknown as jest.Mock;
      createQbMock.mockReturnValueOnce(qb);

      const result = await repo.findLastForUserBefore('g1', 'u1', 5, 2026);

      expect(result).toMatchObject({
        id: 'c-prev',
        month: 4,
        year: 2026,
        monthlySalary: 2400,
      });
      // Le SQL doit tester (year < beforeYear) OR (year = beforeYear AND month < beforeMonth).
      // Implementation libre, on valide juste que getOne est appele.
      expect(qb.getOne).toHaveBeenCalled();
    });

    it('retourne null si aucune contribution anterieure', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValueOnce(null),
      };
      const createQbMock = entityRepo[
        'createQueryBuilder'
      ] as unknown as jest.Mock;
      createQbMock.mockReturnValueOnce(qb);

      expect(await repo.findLastForUserBefore('g1', 'u1', 5, 2026)).toBeNull();
    });
  });

  describe('toDomain mapping', () => {
    it('cast monthlySalary string vers number', async () => {
      const entity = {
        id: 'c1',
        groupId: 'g1',
        userId: 'u1',
        month: 1,
        year: 2026,
        monthlySalary: '1234.56' as unknown as number,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as BudgetMemberContributionEntity;
      entityRepo.find.mockResolvedValueOnce([entity]);

      const [r] = await repo.findByGroupAndPeriod('g1', 1, 2026);

      expect(typeof r.monthlySalary).toBe('number');
      expect(r.monthlySalary).toBe(1234.56);
    });
  });
});
