/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { AddEntryUseCase } from './AddEntry.useCase';
import {
  buildSebastianEntry,
  createMockSebastianEntryRepo,
} from '../../../../../test/factories/sebastian.factory';

describe('AddEntryUseCase', () => {
  let useCase: AddEntryUseCase;
  let entryRepo: ReturnType<typeof createMockSebastianEntryRepo>;

  beforeEach(() => {
    entryRepo = createMockSebastianEntryRepo();
    useCase = new AddEntryUseCase(entryRepo);
  });

  it('devrait creer une entree via le domaine et le repository', async () => {
    const entry = buildSebastianEntry();
    entryRepo.create.mockResolvedValue(entry);

    const result = await useCase.execute({
      userId: 'user-1',
      category: 'coffee',
      quantity: 2,
      date: '2026-03-15',
      notes: 'Espresso',
    });

    expect(entryRepo.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(entry);
  });

  it('devrait propager les erreurs de validation du domaine', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        category: 'soda',
        quantity: 2,
        date: '2026-03-15',
      }),
    ).rejects.toThrow(DomainValidationError);
  });

  it("devrait determiner l'unite automatiquement depuis la categorie", async () => {
    const entry = buildSebastianEntry({
      category: 'alcohol',
      unit: 'standard_drink',
    });
    entryRepo.create.mockResolvedValue(entry);

    await useCase.execute({
      userId: 'user-1',
      category: 'alcohol',
      quantity: 1,
      date: '2026-03-15',
    });

    const createdEntry = entryRepo.create.mock.calls[0][0];
    expect(createdEntry.unit).toBe('standard_drink');
    expect(createdEntry.category).toBe('alcohol');
  });
});
