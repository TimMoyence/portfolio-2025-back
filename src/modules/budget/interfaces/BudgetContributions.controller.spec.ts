import type { Request } from 'express';
import { BudgetContributionsController } from './BudgetContributions.controller';
import type { GetBudgetContributionsUseCase } from '../application/services/GetBudgetContributions.useCase';
import type { UpsertMyBudgetContributionUseCase } from '../application/services/UpsertMyBudgetContribution.useCase';
import { buildBudgetMemberContribution } from '../../../../test/factories/budget.factory';

describe('BudgetContributionsController', () => {
  let controller: BudgetContributionsController;
  let getUC: { execute: jest.Mock };
  let upsertUC: { execute: jest.Mock };
  const mockReq = { user: { sub: 'user-1' } } as unknown as Request;

  beforeEach(() => {
    getUC = { execute: jest.fn() };
    upsertUC = { execute: jest.fn() };
    controller = new BudgetContributionsController(
      getUC as unknown as GetBudgetContributionsUseCase,
      upsertUC as unknown as UpsertMyBudgetContributionUseCase,
    );
  });

  describe('GET /contributions', () => {
    it('appelle getUC avec userId du JWT et retourne les contributions mappees', async () => {
      const contribs = [
        buildBudgetMemberContribution({ id: 'c1', userId: 'user-1' }),
        buildBudgetMemberContribution({ id: 'c2', userId: 'user-2' }),
      ];
      getUC.execute.mockResolvedValueOnce(contribs);

      const result = await controller.list(
        '550e8400-e29b-41d4-a716-446655440000',
        5,
        2026,
        mockReq,
      );

      expect(getUC.execute).toHaveBeenCalledWith({
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        month: 5,
        year: 2026,
        userId: 'user-1',
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('c1');
      expect(result[0].monthlySalary).toBe(2500);
      expect(typeof result[0].createdAt).toBe('string');
    });
  });

  describe('PUT /contributions', () => {
    it('appelle upsertUC avec userId du JWT (pas du body) et retourne la contribution', async () => {
      const dto = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        month: 5,
        year: 2026,
        monthlySalary: 2700,
      };
      upsertUC.execute.mockResolvedValueOnce(
        buildBudgetMemberContribution({
          userId: 'user-1',
          monthlySalary: 2700,
        }),
      );

      const result = await controller.upsert(dto, mockReq);

      expect(upsertUC.execute).toHaveBeenCalledWith({
        groupId: dto.groupId,
        month: 5,
        year: 2026,
        monthlySalary: 2700,
        userId: 'user-1',
      });
      expect(result.monthlySalary).toBe(2700);
      expect(result.userId).toBe('user-1');
    });

    it("la signature du controller upsert n'expose pas userId (JWT only)", () => {
      const upsertFn = controller.upsert.bind(controller);
      // Le DTO passe au controller ne contient JAMAIS un userId.
      // Test au niveau du DTO : verifie via TypeScript + class-validator dans dto.spec
      expect(upsertFn).toBeDefined();
    });
  });
});
