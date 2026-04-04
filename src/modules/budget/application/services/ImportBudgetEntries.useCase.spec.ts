/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ImportBudgetEntriesUseCase } from './ImportBudgetEntries.useCase';
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

  beforeEach(() => {
    entryRepo = createMockBudgetEntryRepo();
    groupRepo = createMockBudgetGroupRepo();
    categoryRepo = createMockBudgetCategoryRepo();
    useCase = new ImportBudgetEntriesUseCase(
      entryRepo,
      groupRepo,
      categoryRepo,
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

  it('devrait inferer la categorie Contribution pour montant positif Tim', async () => {
    const contributionCategory = buildBudgetCategory({
      id: 'cat-contrib',
      name: 'Contribution',
    });

    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.findByGroupId.mockResolvedValue([contributionCategory]);
    entryRepo.createMany.mockResolvedValue([buildBudgetEntry()]);

    const csv =
      'Started Date,Description,Amount,State\n2026-03-15,Tim Moyence,1500,COMPLETED';
    await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      csvContent: csv,
    });

    const [calledEntries] = entryRepo.createMany.mock.calls[0];
    expect(calledEntries[0].categoryId).toBe('cat-contrib');
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
});
