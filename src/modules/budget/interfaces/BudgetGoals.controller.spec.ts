import type { Request } from 'express';
import { BudgetGoalsController } from './BudgetGoals.controller';
import type { CreateBudgetGoalUseCase } from '../application/services/CreateBudgetGoal.useCase';
import type { GetBudgetGoalsWithProgressUseCase } from '../application/services/GetBudgetGoalsWithProgress.useCase';
import type { UpdateBudgetGoalUseCase } from '../application/services/UpdateBudgetGoal.useCase';
import type { DeleteBudgetGoalUseCase } from '../application/services/DeleteBudgetGoal.useCase';
import { buildBudgetGoal } from '../../../../test/factories/budget.factory';
import type { BudgetGoalWithProgress } from '../domain/BudgetGoal';

describe('BudgetGoalsController', () => {
  let controller: BudgetGoalsController;
  let createUC: { execute: jest.Mock };
  let getWithProgressUC: { execute: jest.Mock };
  let updateUC: { execute: jest.Mock };
  let deleteUC: { execute: jest.Mock };
  const mockReq = { user: { sub: 'user-1' } } as unknown as Request;

  beforeEach(() => {
    createUC = { execute: jest.fn() };
    getWithProgressUC = { execute: jest.fn() };
    updateUC = { execute: jest.fn() };
    deleteUC = { execute: jest.fn() };
    controller = new BudgetGoalsController(
      createUC as unknown as CreateBudgetGoalUseCase,
      getWithProgressUC as unknown as GetBudgetGoalsWithProgressUseCase,
      updateUC as unknown as UpdateBudgetGoalUseCase,
      deleteUC as unknown as DeleteBudgetGoalUseCase,
    );
  });

  describe('POST /goals', () => {
    it('appelle CreateGoal UC avec userId du JWT + payload et retourne le goal mappe en DTO', async () => {
      const goal = buildBudgetGoal({ id: 'goal-new', name: 'Vacances ete' });
      createUC.execute.mockResolvedValueOnce(goal);

      const dto = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Vacances ete',
        kind: 'SAVINGS',
        targetAmount: 1000,
        categoryId: undefined,
        deadline: undefined,
      };

      const result = await controller.create(dto as any, mockReq);

      expect(createUC.execute).toHaveBeenCalledWith({
        groupId: dto.groupId,
        userId: 'user-1',
        name: dto.name,
        kind: 'SAVINGS',
        targetAmount: 1000,
        categoryId: null,
        deadline: null,
      });
      expect(result.id).toBe('goal-new');
      expect(result.name).toBe('Vacances ete');
      expect(result.currentAmount).toBe(0);
      expect(result.progressPercent).toBe(0);
      expect(typeof result.createdAt).toBe('string');
    });
  });

  describe('GET /goals', () => {
    it('appelle GetWithProgress UC et retourne un tableau de goals mappes', async () => {
      const goals: BudgetGoalWithProgress[] = [
        {
          ...buildBudgetGoal({ id: 'g1' }),
          currentAmount: 500,
          progressPercent: 50,
        },
        {
          ...buildBudgetGoal({ id: 'g2' }),
          currentAmount: 200,
          progressPercent: 20,
        },
      ];
      getWithProgressUC.execute.mockResolvedValueOnce(goals);

      const result = await controller.list(
        '550e8400-e29b-41d4-a716-446655440000',
        '5',
        '2026',
        mockReq,
      );

      expect(getWithProgressUC.execute).toHaveBeenCalledWith({
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'user-1',
        month: 5,
        year: 2026,
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('g1');
      expect(result[0].currentAmount).toBe(500);
      expect(result[0].progressPercent).toBe(50);
    });
  });

  describe('PATCH /goals/:id', () => {
    it('appelle Update UC avec le patch et userId du JWT', async () => {
      const updatedGoal = buildBudgetGoal({
        id: 'goal-1',
        name: 'Voyage Japan',
      });
      updateUC.execute.mockResolvedValueOnce(updatedGoal);

      const dto = { name: 'Voyage Japan' };
      const result = await controller.update('goal-1', dto as any, mockReq);

      expect(updateUC.execute).toHaveBeenCalledWith({
        goalId: 'goal-1',
        userId: 'user-1',
        patch: expect.objectContaining({ name: 'Voyage Japan' }),
      });
      expect(result.id).toBe('goal-1');
      expect(result.name).toBe('Voyage Japan');
    });
  });

  describe('DELETE /goals/:id', () => {
    it('appelle Delete UC avec goalId et userId du JWT', async () => {
      deleteUC.execute.mockResolvedValueOnce(undefined);

      await controller.remove('goal-1', mockReq);

      expect(deleteUC.execute).toHaveBeenCalledWith({
        goalId: 'goal-1',
        userId: 'user-1',
      });
    });
  });
});
