/* eslint-disable @typescript-eslint/unbound-method */
import { ListEntriesUseCase } from './ListEntries.useCase';
import {
  buildSebastianEntry,
  createMockSebastianEntryRepo,
} from '../../../../../test/factories/sebastian.factory';

describe('ListEntriesUseCase', () => {
  let useCase: ListEntriesUseCase;
  let entryRepo: ReturnType<typeof createMockSebastianEntryRepo>;

  beforeEach(() => {
    entryRepo = createMockSebastianEntryRepo();
    useCase = new ListEntriesUseCase(entryRepo);
  });

  it('devrait deleguer au repository avec les filtres', async () => {
    const entries = [buildSebastianEntry()];
    entryRepo.findByFilters.mockResolvedValue(entries);

    const result = await useCase.execute({
      userId: 'user-1',
      from: '2026-03-01',
      to: '2026-03-31',
      category: 'coffee',
    });

    expect(entryRepo.findByFilters).toHaveBeenCalledWith({
      userId: 'user-1',
      from: '2026-03-01',
      to: '2026-03-31',
      category: 'coffee',
    });
    expect(result).toEqual(entries);
  });

  it('devrait fonctionner sans filtres optionnels', async () => {
    entryRepo.findByFilters.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(entryRepo.findByFilters).toHaveBeenCalledWith({
      userId: 'user-1',
      from: undefined,
      to: undefined,
      category: undefined,
    });
    expect(result).toEqual([]);
  });
});
