/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildWeatherPreferences,
  createMockWeatherPreferencesRepo,
} from '../../../../test/factories/weather.factory';
import type { IWeatherPreferencesRepository } from '../domain/IWeatherPreferences.repository';
import { RecordUsageUseCase } from './RecordUsage.useCase';

describe('RecordUsageUseCase', () => {
  let useCase: RecordUsageUseCase;
  let repo: jest.Mocked<IWeatherPreferencesRepository>;

  beforeEach(() => {
    repo = createMockWeatherPreferencesRepo();
    useCase = new RecordUsageUseCase(repo);
  });

  it('devrait incrementer daysUsed quand lastUsedAt est un jour different', async () => {
    const yesterday = new Date('2026-03-30T10:00:00Z');
    const existing = buildWeatherPreferences({
      userId: 'user-1',
      daysUsed: 5,
      lastUsedAt: yesterday,
    });
    repo.findByUserId.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await useCase.execute({ userId: 'user-1' });

    expect(repo.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({
        daysUsed: 6,
        lastUsedAt: expect.any(Date) as Date,
      }),
    );
  });

  it('devrait ne pas incrementer daysUsed quand lastUsedAt est le meme jour', async () => {
    const today = new Date();
    const existing = buildWeatherPreferences({
      userId: 'user-1',
      daysUsed: 5,
      lastUsedAt: today,
    });
    repo.findByUserId.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await useCase.execute({ userId: 'user-1' });

    expect(repo.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({
        lastUsedAt: expect.any(Date) as Date,
      }),
    );
    // daysUsed ne doit pas apparaitre dans l'appel update
    const updateArgs = repo.update.mock.calls[0][1];
    expect(updateArgs.daysUsed).toBeUndefined();
  });

  it('devrait incrementer quand lastUsedAt est null (premiere utilisation)', async () => {
    const existing = buildWeatherPreferences({
      userId: 'user-1',
      daysUsed: 0,
      lastUsedAt: null,
    });
    repo.findByUserId.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await useCase.execute({ userId: 'user-1' });

    expect(repo.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({
        daysUsed: 1,
        lastUsedAt: expect.any(Date) as Date,
      }),
    );
  });

  it('devrait creer les preferences par lazy init si inexistantes', async () => {
    repo.findByUserId.mockResolvedValue(null);
    const created = buildWeatherPreferences({
      userId: 'user-new',
      daysUsed: 0,
    });
    repo.create.mockResolvedValue(created);
    repo.update.mockResolvedValue(created);

    await useCase.execute({ userId: 'user-new' });

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.update).toHaveBeenCalledTimes(1);
  });
});
