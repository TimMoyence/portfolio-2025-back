import type { Repository } from 'typeorm';
import { BudgetGoalEntity } from './entities/BudgetGoal.entity';
import { BudgetGoal } from '../domain/BudgetGoal';
import { BudgetGoalRepositoryTypeORM } from './BudgetGoal.repository.typeORM';

/**
 * Spec unit (Task 2.6 RED) : `BudgetGoalRepositoryTypeORM` doit
 * implementer `IBudgetGoalRepository` en s'appuyant sur le
 * `Repository<BudgetGoalEntity>` TypeORM.
 *
 * Contrats valides ici (avant implementation — phase RED) :
 *   - `create` : save puis mapping decimal -> number et kind cast.
 *   - `findById` : findOne avec where { id }, retourne null si absent.
 *   - `findByGroupId` : find avec where { groupId }, mapping liste.
 *   - `update` : applique le patch sur l'entite et persiste, retourne mappe.
 *   - `delete` : appelle entityRepo.delete avec id, idempotent si absent.
 *
 * Style : mocks `Repository<...>` typees, identique a
 * `BudgetMemberContribution.repository.typeORM.spec.ts` (DRY, pas de DB).
 * On contourne `@typescript-eslint/unbound-method` via bracket notation
 * `entityRepo['method']` pour acceder aux mocks.
 */
describe('BudgetGoalRepositoryTypeORM', () => {
  let entityRepo: jest.Mocked<Repository<BudgetGoalEntity>>;
  let repo: BudgetGoalRepositoryTypeORM;

  beforeEach(() => {
    entityRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<BudgetGoalEntity>>;
    repo = new BudgetGoalRepositoryTypeORM(entityRepo);
  });

  describe('create', () => {
    it('persiste le goal et retourne sa version mappee domain', async () => {
      const goal = BudgetGoal.create({
        groupId: 'g1',
        createdByUserId: 'u1',
        name: 'Vacances',
        kind: 'SAVINGS',
        targetAmount: 1000,
        categoryId: null,
        deadline: null,
      });
      const saved = {
        id: 'goal-1',
        groupId: 'g1',
        createdByUserId: 'u1',
        name: 'Vacances',
        kind: 'SAVINGS',
        targetAmount: '1000.00' as unknown as number,
        categoryId: null,
        deadline: null,
        isActive: true,
        createdAt: new Date('2026-05-01'),
        updatedAt: new Date('2026-05-01'),
      } as BudgetGoalEntity;
      const saveMock = entityRepo['save'] as unknown as jest.Mock;
      saveMock.mockResolvedValueOnce(saved);

      const result = await repo.create(goal);

      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('goal-1');
      expect(result.kind).toBe('SAVINGS');
      expect(result.targetAmount).toBe(1000);
      expect(typeof result.targetAmount).toBe('number');
    });
  });

  describe('findById', () => {
    it('retourne null si goal absent', async () => {
      const findOneMock = entityRepo['findOne'] as unknown as jest.Mock;
      findOneMock.mockResolvedValueOnce(null);
      expect(await repo.findById('missing')).toBeNull();
    });

    it('mappe vers domain si trouve', async () => {
      const entity = {
        id: 'g1',
        groupId: 'gr1',
        createdByUserId: 'u1',
        name: 'X',
        kind: 'CATEGORY_LIMIT',
        targetAmount: '500.00' as unknown as number,
        categoryId: 'cat-1',
        deadline: new Date('2026-12-31'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as BudgetGoalEntity;
      const findOneMock = entityRepo['findOne'] as unknown as jest.Mock;
      findOneMock.mockResolvedValueOnce(entity);
      const r = await repo.findById('g1');
      expect(r).not.toBeNull();
      expect(r?.kind).toBe('CATEGORY_LIMIT');
      expect(r?.categoryId).toBe('cat-1');
      expect(r?.targetAmount).toBe(500);
    });
  });

  describe('findByGroupId', () => {
    it('retourne [] si find retourne []', async () => {
      const findMock = entityRepo['find'] as unknown as jest.Mock;
      findMock.mockResolvedValueOnce([]);
      expect(await repo.findByGroupId('g1')).toEqual([]);
    });

    it('mappe chaque entity vers domain', async () => {
      const entities = [
        {
          id: 'g1',
          groupId: 'gr1',
          createdByUserId: 'u1',
          name: 'A',
          kind: 'SAVINGS',
          targetAmount: '100.00' as unknown as number,
          categoryId: null,
          deadline: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'g2',
          groupId: 'gr1',
          createdByUserId: 'u1',
          name: 'B',
          kind: 'SPENDING_LIMIT',
          targetAmount: '200.00' as unknown as number,
          categoryId: null,
          deadline: null,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as BudgetGoalEntity[];
      const findMock = entityRepo['find'] as unknown as jest.Mock;
      findMock.mockResolvedValueOnce(entities);
      const r = await repo.findByGroupId('gr1');
      expect(r).toHaveLength(2);
      expect(r[0].kind).toBe('SAVINGS');
      expect(r[1].isActive).toBe(false);
    });
  });

  describe('update', () => {
    it('applique le patch et retourne la version mise a jour', async () => {
      const updated = {
        id: 'g1',
        groupId: 'gr1',
        createdByUserId: 'u1',
        name: 'Renamed',
        kind: 'SAVINGS',
        targetAmount: '1500.00' as unknown as number,
        categoryId: null,
        deadline: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as BudgetGoalEntity;
      const saveMock = entityRepo['save'] as unknown as jest.Mock;
      saveMock.mockResolvedValueOnce(updated);

      const r = await repo.update('g1', {
        name: 'Renamed',
        targetAmount: 1500,
      });

      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'g1',
          name: 'Renamed',
          targetAmount: 1500,
        }),
      );
      expect(r.name).toBe('Renamed');
      expect(r.targetAmount).toBe(1500);
    });
  });

  describe('delete', () => {
    it('appelle entityRepo.delete avec id', async () => {
      const deleteMock = entityRepo['delete'] as unknown as jest.Mock;
      deleteMock.mockResolvedValueOnce({ affected: 1 });
      await repo.delete('g1');
      expect(deleteMock).toHaveBeenCalledWith('g1');
    });

    it('idempotent si goal absent (affected=0)', async () => {
      const deleteMock = entityRepo['delete'] as unknown as jest.Mock;
      deleteMock.mockResolvedValueOnce({ affected: 0 });
      await expect(repo.delete('missing')).resolves.toBeUndefined();
    });
  });
});
