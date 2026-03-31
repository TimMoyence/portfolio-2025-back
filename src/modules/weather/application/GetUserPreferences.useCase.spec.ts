/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildWeatherPreferences,
  createMockWeatherPreferencesRepo,
} from '../../../../test/factories/weather.factory';
import type { IWeatherPreferencesRepository } from '../domain/IWeatherPreferences.repository';
import { GetUserPreferencesUseCase } from './GetUserPreferences.useCase';

describe('GetUserPreferencesUseCase', () => {
  let useCase: GetUserPreferencesUseCase;
  let repo: jest.Mocked<IWeatherPreferencesRepository>;

  beforeEach(() => {
    repo = createMockWeatherPreferencesRepo();
    useCase = new GetUserPreferencesUseCase(repo);
  });

  it('devrait retourner les preferences existantes', async () => {
    const existing = buildWeatherPreferences({
      userId: 'user-1',
      level: 'curious',
    });
    repo.findByUserId.mockResolvedValue(existing);

    const result = await useCase.execute('user-1');

    expect(result).toEqual(existing);
    expect(repo.findByUserId).toHaveBeenCalledWith('user-1');
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("devrait creer des preferences par defaut si aucune n'existe (lazy init)", async () => {
    repo.findByUserId.mockResolvedValue(null);
    const created = buildWeatherPreferences({ userId: 'user-new' });
    repo.create.mockResolvedValue(created);

    const result = await useCase.execute('user-new');

    expect(result).toEqual(created);
    expect(repo.findByUserId).toHaveBeenCalledWith('user-new');
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-new',
        level: 'discovery',
        daysUsed: 0,
      }),
    );
  });
});
