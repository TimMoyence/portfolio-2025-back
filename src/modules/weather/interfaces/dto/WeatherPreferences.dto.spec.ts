import { buildWeatherPreferences } from '../../../../../test/factories/weather.factory';
import { WeatherPreferencesDto } from './WeatherPreferences.dto';

describe('WeatherPreferencesDto', () => {
  it('devrait mapper correctement depuis le domaine', () => {
    const domain = buildWeatherPreferences({
      id: 'pref-1',
      userId: 'user-1',
      level: 'curious',
      favoriteCities: [
        {
          name: 'Paris',
          latitude: 48.85,
          longitude: 2.35,
          country: 'France',
        },
      ],
      daysUsed: 10,
      lastUsedAt: new Date('2026-03-31'),
      tooltipsSeen: ['uv', 'wind'],
      units: { temperature: 'fahrenheit', speed: 'mph', pressure: 'inhg' },
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-03-31'),
    });

    const dto = WeatherPreferencesDto.fromDomain(domain);

    expect(dto.id).toBe('pref-1');
    expect(dto.userId).toBe('user-1');
    expect(dto.level).toBe('curious');
    expect(dto.favoriteCities).toHaveLength(1);
    expect(dto.favoriteCities[0]).toEqual({
      name: 'Paris',
      latitude: 48.85,
      longitude: 2.35,
      country: 'France',
    });
    expect(dto.daysUsed).toBe(10);
    expect(dto.lastUsedAt).toEqual(new Date('2026-03-31'));
    expect(dto.tooltipsSeen).toEqual(['uv', 'wind']);
    expect(dto.units).toEqual({
      temperature: 'fahrenheit',
      speed: 'mph',
      pressure: 'inhg',
    });
    expect(dto.createdAt).toEqual(new Date('2026-01-01'));
    expect(dto.updatedAt).toEqual(new Date('2026-03-31'));
  });

  it('devrait gerer lastUsedAt null', () => {
    const domain = buildWeatherPreferences({ lastUsedAt: null });

    const dto = WeatherPreferencesDto.fromDomain(domain);

    expect(dto.lastUsedAt).toBeNull();
  });
});
