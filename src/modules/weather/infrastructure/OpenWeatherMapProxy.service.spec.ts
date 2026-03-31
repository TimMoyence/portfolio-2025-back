import {
  buildDetailedCurrentWeather,
  buildDetailedForecastResult,
} from '../../../../test/factories/weather.factory';
import { OpenWeatherMapProxyService } from './OpenWeatherMapProxy.service';

/** Reponse brute simulee de l'API OWM /data/2.5/weather. */
const mockOWMCurrentResponse = {
  dt: 1743422400,
  main: {
    temp: 18.5,
    feels_like: 17.2,
    temp_min: 14.0,
    temp_max: 22.0,
    pressure: 1013,
    humidity: 65,
    sea_level: 1013,
    grnd_level: 1010,
  },
  weather: [
    { id: 800, main: 'Clear', description: 'ciel degage', icon: '01d' },
  ],
  wind: { speed: 3.5, deg: 180, gust: 5.5 },
  clouds: { all: 40 },
  visibility: 10000,
  rain: undefined,
  snow: undefined,
  sys: { sunrise: 1743400800, sunset: 1743449400 },
  timezone: 3600,
};

/** Reponse brute simulee de l'API OWM /data/2.5/forecast. */
const mockOWMForecastResponse = {
  list: [
    {
      dt: 1743422400,
      main: {
        temp: 18.5,
        feels_like: 17.2,
        temp_min: 14.0,
        temp_max: 22.0,
        pressure: 1013,
        humidity: 65,
        sea_level: 1013,
        grnd_level: 1010,
      },
      weather: [
        { id: 800, main: 'Clear', description: 'ciel degage', icon: '01d' },
      ],
      wind: { speed: 3.5, deg: 180, gust: 5.5 },
      clouds: { all: 40 },
      visibility: 10000,
      pop: 0.1,
    },
  ],
  city: {
    name: 'Paris',
    country: 'FR',
    coord: { lat: 48.8566, lon: 2.3522 },
    timezone: 3600,
  },
};

describe('OpenWeatherMapProxyService', () => {
  let service: OpenWeatherMapProxyService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new OpenWeatherMapProxyService('test-api-key');
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('getCurrentDetailed', () => {
    it('devrait retourner les donnees meteo detaillees courantes', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOWMCurrentResponse),
      });

      const result = await service.getCurrentDetailed(48.8566, 2.3522);

      expect(result.temperature).toBe(18.5);
      expect(result.humidity).toBe(65);
      // Conversion m/s -> km/h : 3.5 * 3.6 = 12.6
      expect(result.windSpeed).toBeCloseTo(12.6, 1);
      expect(result.windGust).toBeCloseTo(19.8, 1);
      // Conversion m -> km : 10000 / 1000 = 10
      expect(result.visibility).toBe(10);
      expect(result.conditionIcon).toContain('01d@2x.png');
      expect(result.partOfDay).toBe('d');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('api.openweathermap.org'),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('devrait utiliser le cache pour un second appel identique', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOWMCurrentResponse),
      });

      await service.getCurrentDetailed(48.8566, 2.3522);
      const result = await service.getCurrentDetailed(48.8566, 2.3522);

      expect(result.temperature).toBe(18.5);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("devrait inclure la cle API dans l'URL", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOWMCurrentResponse),
      });

      await service.getCurrentDetailed(48.8566, 2.3522);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('appid=test-api-key'),
        expect.any(Object),
      );
    });
  });

  describe('getForecastDetailed', () => {
    it('devrait retourner les previsions detaillees avec agregation journaliere', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOWMForecastResponse),
      });

      const result = await service.getForecastDetailed(48.8566, 2.3522);

      expect(result.cityName).toBe('Paris');
      expect(result.country).toBe('FR');
      expect(result.hourly).toHaveLength(1);
      expect(result.daily).toHaveLength(1);
      expect(result.hourly[0].precipitationProbability).toBe(10);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('devrait utiliser le cache pour un second appel identique', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOWMForecastResponse),
      });

      await service.getForecastDetailed(48.8566, 2.3522);
      const result = await service.getForecastDetailed(48.8566, 2.3522);

      expect(result.cityName).toBe('Paris');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('gestion des erreurs', () => {
    it('devrait lancer une erreur en cas de timeout', async () => {
      fetchSpy.mockImplementationOnce(
        (_url: string, options: { signal: AbortSignal }) => {
          return new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => {
              const error = new DOMException('Aborted', 'AbortError');
              reject(error);
            });
          });
        },
      );

      jest.useFakeTimers();

      const promise = service.getCurrentDetailed(48.8566, 2.3522);
      jest.advanceTimersByTime(8_001);

      await expect(promise).rejects.toThrow('OpenWeatherMap timeout');

      jest.useRealTimers();
    });

    it('devrait lancer une erreur en cas de reponse HTTP non-OK', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(service.getCurrentDetailed(48.8566, 2.3522)).rejects.toThrow(
        'OpenWeatherMap HTTP 401',
      );
    });
  });
});

// Ces references aux factories servent a verifier que les builders sont fonctionnels
describe('Weather test factories', () => {
  it('devrait construire un DetailedCurrentWeather valide', () => {
    const result = buildDetailedCurrentWeather({ temperature: 25.0 });
    expect(result.temperature).toBe(25.0);
    expect(result.conditionIcon).toContain('openweathermap');
  });

  it('devrait construire un DetailedForecastResult valide', () => {
    const result = buildDetailedForecastResult({ cityName: 'Lyon' });
    expect(result.cityName).toBe('Lyon');
    expect(result.hourly).toHaveLength(1);
    expect(result.daily).toHaveLength(1);
  });
});
