/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { AddEntryUseCase } from './AddEntry.useCase';
import {
  buildSebastianEntry,
  createMockBadgesEvaluationQueue,
  createMockSebastianEntryRepo,
} from '../../../../../test/factories/sebastian.factory';

describe('AddEntryUseCase', () => {
  let useCase: AddEntryUseCase;
  let entryRepo: ReturnType<typeof createMockSebastianEntryRepo>;
  let badgesQueue: ReturnType<typeof createMockBadgesEvaluationQueue>;

  beforeEach(() => {
    entryRepo = createMockSebastianEntryRepo();
    badgesQueue = createMockBadgesEvaluationQueue();
    useCase = new AddEntryUseCase(entryRepo, badgesQueue);
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

  it('devrait enfiler un job badges apres la creation (au lieu d appeler EvaluateBadges directement)', async () => {
    const entry = buildSebastianEntry();
    entryRepo.create.mockResolvedValue(entry);

    await useCase.execute({
      userId: 'user-1',
      category: 'coffee',
      quantity: 2,
      date: '2026-03-15',
    });

    expect(badgesQueue.enqueue).toHaveBeenCalledTimes(1);
    expect(badgesQueue.enqueue).toHaveBeenCalledWith('user-1');
  });

  it('devrait propager consumedAt au domaine', async () => {
    const entry = buildSebastianEntry({
      consumedAt: new Date('2026-04-08T22:08:00.000Z'),
    });
    entryRepo.create.mockResolvedValue(entry);

    await useCase.execute({
      userId: 'user-1',
      category: 'coffee',
      quantity: 2,
      date: '2026-03-15',
      consumedAt: '2026-04-08T22:08:00.000Z',
    });

    const createdEntry = entryRepo.create.mock.calls[0][0];
    expect(createdEntry.consumedAt).toEqual(
      new Date('2026-04-08T22:08:00.000Z'),
    );
  });

  it("ne devrait pas bloquer si l'enqueue badges echoue", async () => {
    const entry = buildSebastianEntry();
    entryRepo.create.mockResolvedValue(entry);
    badgesQueue.enqueue.mockRejectedValue(new Error('redis down'));

    const result = await useCase.execute({
      userId: 'user-1',
      category: 'coffee',
      quantity: 2,
      date: '2026-03-15',
    });

    expect(result).toEqual(entry);
  });

  it('devrait logger le nom, le message et un extrait de stack quand l enqueue rejette une Error', async () => {
    const entry = buildSebastianEntry();
    entryRepo.create.mockResolvedValue(entry);
    const enqueueError = new Error('boom: queue connection refused');
    enqueueError.name = 'QueueEnqueueError';
    badgesQueue.enqueue.mockRejectedValue(enqueueError);
    const warnSpy = jest
      .spyOn(useCase['logger'], 'warn')
      .mockImplementation(() => undefined);

    await useCase.execute({
      userId: 'user-42',
      category: 'coffee',
      quantity: 2,
      date: '2026-03-15',
    });

    // Laisser la microtask fire-and-forget se resoudre.
    await new Promise((resolve) => setImmediate(resolve));

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const logged = String(warnSpy.mock.calls[0][0]);
    expect(logged).toContain('user-42');
    expect(logged).toContain('QueueEnqueueError');
    expect(logged).toContain('boom: queue connection refused');
    expect(logged).toContain('stack=');
  });

  it('devrait logger la forme string quand l enqueue rejette une valeur non-Error', async () => {
    const entry = buildSebastianEntry();
    entryRepo.create.mockResolvedValue(entry);
    badgesQueue.enqueue.mockRejectedValue('plain string failure');
    const warnSpy = jest
      .spyOn(useCase['logger'], 'warn')
      .mockImplementation(() => undefined);

    await useCase.execute({
      userId: 'user-99',
      category: 'coffee',
      quantity: 2,
      date: '2026-03-15',
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const logged = String(warnSpy.mock.calls[0][0]);
    expect(logged).toContain('user-99');
    expect(logged).toContain('plain string failure');
    expect(logged).not.toContain('stack=');
  });
});
