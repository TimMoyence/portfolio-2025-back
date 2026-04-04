/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { GetRecurringEntriesUseCase } from './GetRecurringEntries.useCase';
import {
  buildRecurringEntry,
  createMockRecurringEntryRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';

describe('GetRecurringEntriesUseCase', () => {
  let useCase: GetRecurringEntriesUseCase;
  let recurringRepo: ReturnType<typeof createMockRecurringEntryRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;

  beforeEach(() => {
    recurringRepo = createMockRecurringEntryRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new GetRecurringEntriesUseCase(recurringRepo, groupRepo);
  });

  it("devrait rejeter si l'utilisateur n'est pas membre du groupe", async () => {
    groupRepo.isMember.mockResolvedValue(false);

    await expect(useCase.execute('group-1', 'user-1')).rejects.toThrow(
      InsufficientPermissionsError,
    );
  });

  it('devrait retourner les entrees recurrentes du groupe', async () => {
    const entries = [
      buildRecurringEntry(),
      buildRecurringEntry({ id: 'recurring-2', description: 'Assurance' }),
    ];
    groupRepo.isMember.mockResolvedValue(true);
    recurringRepo.findByGroupId.mockResolvedValue(entries);

    const result = await useCase.execute('group-1', 'user-1');

    expect(result).toEqual(entries);
    expect(groupRepo.isMember).toHaveBeenCalledWith('group-1', 'user-1');
    expect(recurringRepo.findByGroupId).toHaveBeenCalledWith('group-1');
  });

  it('devrait retourner un tableau vide si aucune entree recurrente', async () => {
    groupRepo.isMember.mockResolvedValue(true);
    recurringRepo.findByGroupId.mockResolvedValue([]);

    const result = await useCase.execute('group-1', 'user-1');

    expect(result).toEqual([]);
  });
});
