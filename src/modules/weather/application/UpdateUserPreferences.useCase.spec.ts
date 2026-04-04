/* eslint-disable @typescript-eslint/unbound-method */
import { InvalidInputError } from '../../../common/domain/errors';
import {
  buildWeatherPreferences,
  createMockWeatherPreferencesRepo,
} from '../../../../test/factories/weather.factory';
import type { IWeatherPreferencesRepository } from '../domain/IWeatherPreferences.repository';
import { UpdateUserPreferencesUseCase } from './UpdateUserPreferences.useCase';

describe('UpdateUserPreferencesUseCase', () => {
  let useCase: UpdateUserPreferencesUseCase;
  let repo: jest.Mocked<IWeatherPreferencesRepository>;

  beforeEach(() => {
    repo = createMockWeatherPreferencesRepo();
    useCase = new UpdateUserPreferencesUseCase(repo);
  });

  it('devrait mettre a jour le niveau avec une valeur valide', async () => {
    const existing = buildWeatherPreferences({ userId: 'user-1' });
    const updated = buildWeatherPreferences({
      userId: 'user-1',
      level: 'expert',
    });
    repo.findByUserId.mockResolvedValue(existing);
    repo.update.mockResolvedValue(updated);

    const result = await useCase.execute({
      userId: 'user-1',
      level: 'expert',
    });

    expect(result.level).toBe('expert');
    expect(repo.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({ level: 'expert' }),
    );
  });

  it('devrait rejeter un niveau invalide', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        level: 'invalid' as 'discovery',
      }),
    ).rejects.toThrow(InvalidInputError);
  });

  it('devrait mettre a jour les villes favorites', async () => {
    const existing = buildWeatherPreferences({ userId: 'user-1' });
    const cities = [
      {
        name: 'Paris',
        latitude: 48.8566,
        longitude: 2.3522,
        country: 'France',
      },
    ];
    const updated = buildWeatherPreferences({
      userId: 'user-1',
      favoriteCities: cities,
    });
    repo.findByUserId.mockResolvedValue(existing);
    repo.update.mockResolvedValue(updated);

    const result = await useCase.execute({
      userId: 'user-1',
      favoriteCities: cities,
    });

    expect(result.favoriteCities).toEqual(cities);
  });

  it('devrait creer les preferences par lazy init si inexistantes', async () => {
    repo.findByUserId.mockResolvedValue(null);
    const created = buildWeatherPreferences({ userId: 'user-new' });
    const updated = buildWeatherPreferences({
      userId: 'user-new',
      level: 'curious',
    });
    repo.create.mockResolvedValue(created);
    repo.update.mockResolvedValue(updated);

    const result = await useCase.execute({
      userId: 'user-new',
      level: 'curious',
    });

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(result.level).toBe('curious');
  });

  it('devrait fusionner partiellement les unites', async () => {
    const existing = buildWeatherPreferences({
      userId: 'user-1',
      units: { temperature: 'celsius', speed: 'kmh', pressure: 'hpa' },
    });
    const updated = buildWeatherPreferences({
      userId: 'user-1',
      units: { temperature: 'fahrenheit', speed: 'kmh', pressure: 'hpa' },
    });
    repo.findByUserId.mockResolvedValue(existing);
    repo.update.mockResolvedValue(updated);

    const result = await useCase.execute({
      userId: 'user-1',
      units: { temperature: 'fahrenheit' },
    });

    expect(result.units.temperature).toBe('fahrenheit');
    expect(result.units.speed).toBe('kmh');
    expect(result.units.pressure).toBe('hpa');
    expect(repo.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({
        units: { temperature: 'fahrenheit', speed: 'kmh', pressure: 'hpa' },
      }),
    );
  });
});
