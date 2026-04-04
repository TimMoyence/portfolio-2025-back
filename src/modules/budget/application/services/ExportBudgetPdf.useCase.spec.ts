import { InsufficientPermissionsError } from '../../../../common/domain/errors';
import { ExportBudgetPdfUseCase } from './ExportBudgetPdf.useCase';
import {
  createMockBudgetEntryRepo,
  createMockBudgetGroupRepo,
  createMockBudgetCategoryRepo,
  buildBudgetEntry,
  buildBudgetCategory,
} from '../../../../../test/factories/budget.factory';
import type { ExportBudgetPdfCommand } from '../dto/ExportBudgetPdf.command';

describe('ExportBudgetPdfUseCase', () => {
  let useCase: ExportBudgetPdfUseCase;
  let entryRepo: ReturnType<typeof createMockBudgetEntryRepo>;
  let categoryRepo: ReturnType<typeof createMockBudgetCategoryRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;

  const defaultCommand: ExportBudgetPdfCommand = {
    userId: 'user-1',
    groupId: 'group-1',
    month: 3,
    year: 2026,
  };

  beforeEach(() => {
    entryRepo = createMockBudgetEntryRepo();
    categoryRepo = createMockBudgetCategoryRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new ExportBudgetPdfUseCase(entryRepo, categoryRepo, groupRepo);
  });

  it("devrait rejeter si l'utilisateur n'est pas membre du groupe", async () => {
    groupRepo.isMember.mockResolvedValue(false);

    await expect(useCase.execute(defaultCommand)).rejects.toThrow(
      InsufficientPermissionsError,
    );
  });

  it('devrait retourner un Buffer non-vide', async () => {
    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.findByFilters.mockResolvedValue([
      buildBudgetEntry({ amount: -100, categoryId: 'cat-1' }),
      buildBudgetEntry({ id: 'entry-2', amount: 500, categoryId: 'cat-2' }),
    ]);
    categoryRepo.findByGroupId.mockResolvedValue([
      buildBudgetCategory({ id: 'cat-1', name: 'Courses', budgetLimit: 300 }),
      buildBudgetCategory({
        id: 'cat-2',
        name: 'Salaire',
        budgetType: 'FIXED',
        budgetLimit: 0,
      }),
    ]);

    const buffer = await useCase.execute(defaultCommand);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('devrait generer un PDF valide (magic bytes %PDF)', async () => {
    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.findByFilters.mockResolvedValue([
      buildBudgetEntry({ amount: -50 }),
    ]);
    categoryRepo.findByGroupId.mockResolvedValue([
      buildBudgetCategory({ id: 'cat-1' }),
    ]);

    const buffer = await useCase.execute(defaultCommand);

    const header = buffer.subarray(0, 4).toString('ascii');
    expect(header).toBe('%PDF');
  });

  it('devrait generer un PDF meme sans entrees', async () => {
    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.findByFilters.mockResolvedValue([]);
    categoryRepo.findByGroupId.mockResolvedValue([]);

    const buffer = await useCase.execute(defaultCommand);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    const header = buffer.subarray(0, 4).toString('ascii');
    expect(header).toBe('%PDF');
  });
});
