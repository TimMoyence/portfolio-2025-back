import { WeatherCache } from './weather-cache';

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
});
