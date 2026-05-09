import { InsufficientPermissionsError } from '../../../../common/domain/errors';
import { ExportBudgetPdfUseCase } from './ExportBudgetPdf.useCase';
import { BudgetPdfRenderer } from '../../infrastructure/pdf/BudgetPdfRenderer';
import type { IBudgetPdfRenderer } from '../../domain/IBudgetPdfRenderer';
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
  let renderer: BudgetPdfRenderer;

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
    renderer = new BudgetPdfRenderer();
    useCase = new ExportBudgetPdfUseCase(
      entryRepo,
      categoryRepo,
      groupRepo,
      renderer,
    );
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

  it('devrait deleguer le rendu au IBudgetPdfRenderer avec les donnees fetchees', async () => {
    groupRepo.isMember.mockResolvedValue(true);
    const entries = [buildBudgetEntry({ amount: -42, categoryId: 'cat-1' })];
    const categories = [buildBudgetCategory({ id: 'cat-1', name: 'Courses' })];
    entryRepo.findByFilters.mockResolvedValue(entries);
    categoryRepo.findByGroupId.mockResolvedValue(categories);

    const renderFn = jest
      .fn<Promise<Buffer>, [unknown]>()
      .mockResolvedValue(Buffer.from('rendered-by-mock'));
    const fakeRenderer: IBudgetPdfRenderer = { render: renderFn };

    const useCaseWithMock = new ExportBudgetPdfUseCase(
      entryRepo,
      categoryRepo,
      groupRepo,
      fakeRenderer,
    );

    const buffer = await useCaseWithMock.execute(defaultCommand);

    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(renderFn).toHaveBeenCalledWith(
      expect.objectContaining({
        command: defaultCommand,
        entries,
        categories,
        generatedAt: expect.any(Date),
      }),
    );
    expect(buffer.toString()).toBe('rendered-by-mock');
  });
});
