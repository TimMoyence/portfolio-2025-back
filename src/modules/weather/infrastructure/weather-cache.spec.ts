import { WeatherCache } from './weather-cache';
import * as ttlStrategy from './weather-ttl-strategy';

describe('WeatherCache', () => {
  let cache: WeatherCache;

  beforeEach(() => {
    cache = new WeatherCache();
  });

  it('devrait retourner la valeur stockee avant expiration du TTL', () => {
    cache.set('cle', { temp: 20 }, 60_000);
    const result = cache.get<{ temp: number }>('cle');

    expect(result).toEqual({ temp: 20 });
  });

  it('devrait retourner null apres expiration du TTL', () => {
    jest.useFakeTimers();

    cache.set('cle', { temp: 20 }, 1_000);
    jest.advanceTimersByTime(1_001);

    const result = cache.get<{ temp: number }>('cle');
    expect(result).toBeNull();

    jest.useRealTimers();
  });

  it('devrait retourner null pour une cle inexistante', () => {
    const result = cache.get('inexistante');
    expect(result).toBeNull();
  });

  it('devrait ecraser une valeur existante', () => {
    cache.set('cle', { temp: 20 }, 60_000);
    cache.set('cle', { temp: 25 }, 60_000);

    const result = cache.get<{ temp: number }>('cle');
    expect(result).toEqual({ temp: 25 });
  });

  // --- setWithStrategy ---

  describe('setWithStrategy', () => {
    it('devrait stocker une valeur avec le TTL calcule par la strategie', () => {
      const spy = jest
        .spyOn(ttlStrategy, 'computeWeatherTtl')
        .mockReturnValue(30_000);

      cache.setWithStrategy('key-1', { temp: 20 }, 'forecast', 95);

      expect(spy).toHaveBeenCalledWith('forecast', 95);
      expect(cache.get('key-1')).toEqual({ temp: 20 });
      spy.mockRestore();
    });

    it('devrait fonctionner sans weather code', () => {
      const spy = jest
        .spyOn(ttlStrategy, 'computeWeatherTtl')
        .mockReturnValue(60_000);

      cache.setWithStrategy('key-2', { city: 'Paris' }, 'geocoding');

      expect(spy).toHaveBeenCalledWith('geocoding', undefined);
      expect(cache.get('key-2')).toEqual({ city: 'Paris' });
      spy.mockRestore();
    });

    it('devrait expirer la valeur apres le TTL calcule', () => {
      jest.useFakeTimers();
      const spy = jest
        .spyOn(ttlStrategy, 'computeWeatherTtl')
        .mockReturnValue(5_000);

      cache.setWithStrategy('key-3', { temp: 10 }, 'alerts');
      jest.advanceTimersByTime(5_001);

      expect(cache.get('key-3')).toBeNull();
      spy.mockRestore();
      jest.useRealTimers();
    });
  });
});
