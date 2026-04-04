import {
  WeatherUserPreferences,
  DEFAULT_UNITS,
} from './WeatherUserPreferences';

describe('WeatherUserPreferences', () => {
  describe('create', () => {
    it('devrait creer des preferences par defaut pour un nouvel utilisateur', () => {
      const prefs = WeatherUserPreferences.create('user-1');

      expect(prefs.userId).toBe('user-1');
      expect(prefs.level).toBe('discovery');
      expect(prefs.favoriteCities).toEqual([]);
      expect(prefs.defaultCityIndex).toBeNull();
      expect(prefs.daysUsed).toBe(0);
      expect(prefs.lastUsedAt).toBeNull();
      expect(prefs.tooltipsSeen).toEqual([]);
      expect(prefs.units).toEqual(DEFAULT_UNITS);
      expect(prefs.id).toBe('');
      expect(prefs.createdAt).toBeInstanceOf(Date);
      expect(prefs.updatedAt).toBeInstanceOf(Date);
    });

    it('devrait avoir des unites par defaut celsius/kmh/hpa', () => {
      const prefs = WeatherUserPreferences.create('user-1');
      expect(prefs.units.temperature).toBe('celsius');
      expect(prefs.units.speed).toBe('kmh');
      expect(prefs.units.pressure).toBe('hpa');
    });
  });

  describe('fromPersistence', () => {
    it('devrait reconstruire une instance a partir de donnees persistees', () => {
      const now = new Date();
      const prefs = WeatherUserPreferences.fromPersistence({
        id: 'pref-42',
        userId: 'user-1',
        level: 'expert',
        favoriteCities: [
          { name: 'Paris', latitude: 48.85, longitude: 2.35, country: 'FR' },
        ],
        defaultCityIndex: 0,
        daysUsed: 15,
        lastUsedAt: now,
        tooltipsSeen: ['wind', 'pressure'],
        units: { temperature: 'fahrenheit', speed: 'mph', pressure: 'inhg' },
        createdAt: now,
        updatedAt: now,
      });

      expect(prefs.id).toBe('pref-42');
      expect(prefs.level).toBe('expert');
      expect(prefs.favoriteCities).toHaveLength(1);
      expect(prefs.favoriteCities[0].name).toBe('Paris');
      expect(prefs.defaultCityIndex).toBe(0);
      expect(prefs.daysUsed).toBe(15);
      expect(prefs.lastUsedAt).toBe(now);
      expect(prefs.tooltipsSeen).toEqual(['wind', 'pressure']);
      expect(prefs.units.temperature).toBe('fahrenheit');
      expect(prefs.units.speed).toBe('mph');
      expect(prefs.units.pressure).toBe('inhg');
    });
  });

  describe('DEFAULT_UNITS', () => {
    it('devrait exporter les valeurs par defaut correctes', () => {
      expect(DEFAULT_UNITS).toEqual({
        temperature: 'celsius',
        speed: 'kmh',
        pressure: 'hpa',
      });
    });
  });
});
