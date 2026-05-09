/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ImportBudgetEntriesUseCase } from './ImportBudgetEntries.useCase';
import type { ICategoryInferenceStrategy } from '../../domain/ICategoryInferenceStrategy';
import { RevolutCategoryInferenceStrategy } from '../../infrastructure/inference/RevolutCategoryInferenceStrategy';
import { defaultCategoryRulesConfig } from '../../infrastructure/inference/category-rules.config';
import {
  createMockBudgetEntryRepo,
  createMockBudgetGroupRepo,
  createMockBudgetCategoryRepo,
  buildBudgetEntry,
  buildBudgetCategory,
} from '../../../../../test/factories/budget.factory';

describe('ImportBudgetEntriesUseCase', () => {
  let useCase: ImportBudgetEntriesUseCase;
  let entryRepo: ReturnType<typeof createMockBudgetEntryRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;
  let categoryRepo: ReturnType<typeof createMockBudgetCategoryRepo>;
  let inferenceStrategy: RevolutCategoryInferenceStrategy;

  beforeEach(() => {
    entryRepo = createMockBudgetEntryRepo();
    groupRepo = createMockBudgetGroupRepo();
    categoryRepo = createMockBudgetCategoryRepo();
    inferenceStrategy = new RevolutCategoryInferenceStrategy(
      defaultCategoryRulesConfig,
    );
    useCase = new ImportBudgetEntriesUseCase(
      entryRepo,
      groupRepo,
      categoryRepo,
      inferenceStrategy,
    );
  });

  it("devrait rejeter si l'utilisateur n'est pas membre du groupe", async () => {
    groupRepo.isMember.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: 'user-1',
        groupId: 'group-1',
        csvContent: 'Started Date,Description,Amount,State',
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it('devrait parser un CSV valide et creer les entrees', async () => {
    const categoryId = 'cat-courses';
    const category = buildBudgetCategory({ id: categoryId, name: 'Courses' });
    const entry = buildBudgetEntry({
      categoryId,
      description: 'Carrefour',
      amount: -85.5,
    });

    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.findByGroupId.mockResolvedValue([category]);
    entryRepo.createMany.mockResolvedValue([entry]);

    const csv =
      'Started Date,Description,Amount,State\n2026-03-15,Carrefour,-85.50,COMPLETED';
    const result = await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      csvContent: csv,
    });

    expect(entryRepo.createMany).toHaveBeenCalledTimes(1);
    const [calledEntries] = entryRepo.createMany.mock.calls[0];
    expect(calledEntries).toHaveLength(1);
    expect(calledEntries[0].categoryId).toBe(categoryId);
    expect(result).toEqual([entry]);
  });

  it('devrait inferer la categorie Courses pour Carrefour', async () => {
    const coursesCategory = buildBudgetCategory({
      id: 'cat-courses',
      name: 'Courses',
    });

    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.findByGroupId.mockResolvedValue([coursesCategory]);
    entryRepo.createMany.mockResolvedValue([buildBudgetEntry()]);

    const csv =
      'Started Date,Description,Amount,State\n2026-03-15,Carrefour,-85.50,COMPLETED';
    await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      csvContent: csv,
    });

    const [calledEntries] = entryRepo.createMany.mock.calls[0];
    expect(calledEntries[0].categoryId).toBe('cat-courses');
  });

  it('devrait retourner Autres pour une description non reconnue', async () => {
    const autresCategory = buildBudgetCategory({
      id: 'cat-autres',
      name: 'Autres',
    });

    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.findByGroupId.mockResolvedValue([autresCategory]);
    entryRepo.createMany.mockResolvedValue([buildBudgetEntry()]);

    const csv =
      'Started Date,Description,Amount,State\n2026-03-15,Random Shop,-20,COMPLETED';
    await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      csvContent: csv,
    });

    const [calledEntries] = entryRepo.createMany.mock.calls[0];
    expect(calledEntries[0].categoryId).toBe('cat-autres');
  });

  it('devrait retourner un tableau vide pour un CSV avec seulement les headers', async () => {
    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.findByGroupId.mockResolvedValue([]);
    entryRepo.createMany.mockResolvedValue([]);

    const csv = 'Started Date,Description,Amount,State';
    await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      csvContent: csv,
    });

    const [calledEntries] = entryRepo.createMany.mock.calls[0];
    expect(calledEntries).toHaveLength(0);
  });

  it('devrait gerer un CSV avec des guillemets', async () => {
    const coursesCategory = buildBudgetCategory({
      id: 'cat-courses',
      name: 'Courses',
    });

    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.findByGroupId.mockResolvedValue([coursesCategory]);
    entryRepo.createMany.mockResolvedValue([buildBudgetEntry()]);

    const csv =
      'Started Date,Description,Amount,State\n2026-03-15,"Carrefour, City",-30,COMPLETED';
    await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      csvContent: csv,
    });

    const [calledEntries] = entryRepo.createMany.mock.calls[0];
    expect(calledEntries[0].description).toBe('Carrefour, City');
  });

  it('devrait parser un CSV separe par point-virgule avec montant europeen', async () => {
    const gymCategory = buildBudgetCategory({
      id: 'cat-gym',
      name: 'Salle de sport',
    });

    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.findByGroupId.mockResolvedValue([gymCategory]);
    entryRepo.createMany.mockResolvedValue([buildBudgetEntry()]);

    const csv =
      'Date;Description;Montant;State\n2026-03-15;Basic Fit;-45,00;COMPLETED';
    await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      csvContent: csv,
    });

    const [calledEntries] = entryRepo.createMany.mock.calls[0];
    expect(calledEntries[0].amount).toBe(-45);
    expect(calledEntries[0].categoryId).toBe('cat-gym');
  });

  it('devrait inferer Pockets pour pocket withdrawal positif', async () => {
    const pocketsCategory = buildBudgetCategory({
      id: 'cat-pockets',
      name: 'Pockets',
    });

    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.findByGroupId.mockResolvedValue([pocketsCategory]);
    entryRepo.createMany.mockResolvedValue([buildBudgetEntry()]);

    const csv =
      'Started Date,Description,Amount,State\n2026-03-15,Pocket withdrawal,50,COMPLETED';
    await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      csvContent: csv,
    });

    const [calledEntries] = entryRepo.createMany.mock.calls[0];
    expect(calledEntries[0].categoryId).toBe('cat-pockets');
  });

  it('devrait deleguer l inference de categorie au ICategoryInferenceStrategy injecte', async () => {
    const fixedCategory = buildBudgetCategory({
      id: 'cat-fixed',
      name: 'CategorieX',
    });

    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.findByGroupId.mockResolvedValue([fixedCategory]);
    entryRepo.createMany.mockResolvedValue([buildBudgetEntry()]);

    const inferFn = jest
      .fn<string | null, [string, string, number]>()
      .mockReturnValue('CategorieX');
    const fakeStrategy: ICategoryInferenceStrategy = { infer: inferFn };

    const useCaseWithMock = new ImportBudgetEntriesUseCase(
      entryRepo,
      groupRepo,
      categoryRepo,
      fakeStrategy,
    );

    const csv =
      'Started Date,Description,Amount,Type,State\n' +
      '2026-03-15,Random merchant,-12,CARD_PAYMENT,COMPLETED\n' +
      '2026-03-16,Another shop,-7,CARD_PAYMENT,COMPLETED';
    await useCaseWithMock.execute({
      userId: 'user-1',
      groupId: 'group-1',
      csvContent: csv,
    });

    expect(inferFn).toHaveBeenCalledTimes(2);
    const [calledEntries] = entryRepo.createMany.mock.calls[0];
    expect(calledEntries).toHaveLength(2);
    expect(calledEntries[0].categoryId).toBe('cat-fixed');
    expect(calledEntries[1].categoryId).toBe('cat-fixed');
  });
});
