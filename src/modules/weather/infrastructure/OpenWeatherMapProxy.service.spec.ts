import {
  buildDetailedCurrentWeather,
  buildDetailedForecastResult,
  buildOwmCurrentPayload,
  buildOwmForecastPayload,
} from '../../../../test/factories/weather.factory';
import {
  httpErrorResponse,
  mockAbortableFetchOnce,
  okJsonResponse,
} from '../../../../test/helpers/fetch-spy';
import { OpenWeatherMapProxyService } from './OpenWeatherMapProxy.service';

const mockOWMCurrentResponse = buildOwmCurrentPayload({
  rain: undefined,
  snow: undefined,
});

const mockOWMForecastResponse = buildOwmForecastPayload();

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
      fetchSpy.mockResolvedValueOnce(okJsonResponse(mockOWMCurrentResponse));

      const result = await service.getCurrentDetailed(48.8566, 2.3522);

      expect(result.temperatureCelsius).toBe(18.5);
      expect(result.humidityPercent).toBe(65);
      expect(result.windSpeedKmh).toBeCloseTo(12.6, 1);
      expect(result.windGustKmh).toBeCloseTo(19.8, 1);
      expect(result.visibilityKm).toBe(10);
      expect(result.conditionIcon).toContain('01d@2x.png');
      expect(result.partOfDay).toBe('d');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('api.openweathermap.org'),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('devrait utiliser le cache pour un second appel identique', async () => {
      fetchSpy.mockResolvedValueOnce(okJsonResponse(mockOWMCurrentResponse));

      await service.getCurrentDetailed(48.8566, 2.3522);
      const result = await service.getCurrentDetailed(48.8566, 2.3522);

      expect(result.temperatureCelsius).toBe(18.5);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("devrait inclure la cle API dans l'URL", async () => {
      fetchSpy.mockResolvedValueOnce(okJsonResponse(mockOWMCurrentResponse));

      await service.getCurrentDetailed(48.8566, 2.3522);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('appid=test-api-key'),
        expect.any(Object),
      );
    });
  });

  describe('getForecastDetailed', () => {
    it('devrait retourner les previsions detaillees avec agregation journaliere', async () => {
      fetchSpy.mockResolvedValueOnce(okJsonResponse(mockOWMForecastResponse));

      const result = await service.getForecastDetailed(48.8566, 2.3522);

      expect(result.cityName).toBe('Paris');
      expect(result.country).toBe('FR');
      expect(result.hourly).toHaveLength(1);
      expect(result.daily).toHaveLength(1);
      expect(result.hourly[0].precipitationProbabilityPercent).toBe(10);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('devrait utiliser le cache pour un second appel identique', async () => {
      fetchSpy.mockResolvedValueOnce(okJsonResponse(mockOWMForecastResponse));

      await service.getForecastDetailed(48.8566, 2.3522);
      const result = await service.getForecastDetailed(48.8566, 2.3522);

      expect(result.cityName).toBe('Paris');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('gestion des erreurs', () => {
    it('devrait lancer une erreur en cas de timeout', async () => {
      mockAbortableFetchOnce(fetchSpy);

      jest.useFakeTimers();

      const promise = service.getCurrentDetailed(48.8566, 2.3522);
      jest.advanceTimersByTime(8_001);

      await expect(promise).rejects.toThrow('OpenWeatherMap timeout');

      jest.useRealTimers();
    });

    it('devrait lancer une erreur en cas de reponse HTTP non-OK', async () => {
      fetchSpy.mockResolvedValueOnce(httpErrorResponse(401));

      await expect(service.getCurrentDetailed(48.8566, 2.3522)).rejects.toThrow(
        'OpenWeatherMap HTTP 401',
      );
    });
  });
});

describe('Weather test factories', () => {
  it('devrait construire un DetailedCurrentWeather valide', () => {
    const result = buildDetailedCurrentWeather({ temperatureCelsius: 25.0 });
    expect(result.temperatureCelsius).toBe(25.0);
    expect(result.conditionIcon).toContain('openweathermap');
  });

  it('devrait construire un DetailedForecastResult valide', () => {
    const result = buildDetailedForecastResult({ cityName: 'Lyon' });
    expect(result.cityName).toBe('Lyon');
    expect(result.hourly).toHaveLength(1);
    expect(result.daily).toHaveLength(1);
  });
});
