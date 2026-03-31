import { OpenMeteoProxyService } from './OpenMeteoProxy.service';
import type {
  ForecastResult,
  GeocodingResult,
} from '../domain/IWeatherProxy.port';
import {
  buildAirQualityResult,
  buildForecastResult,
  buildHistoricalResult,
} from '../../../../test/factories/weather.factory';

const mockGeocodingResponse: GeocodingResult = {
  results: [
    {
      id: 2988507,
      name: 'Paris',
      latitude: 48.8566,
      longitude: 2.3522,
      country: 'France',
      country_code: 'FR',
      admin1: 'Ile-de-France',
    },
  ],
};

const mockForecastResponse: ForecastResult = buildForecastResult();

describe('OpenMeteoProxyService', () => {
  let service: OpenMeteoProxyService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new OpenMeteoProxyService();
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('searchCity', () => {
    it('devrait retourner les resultats de geocodage', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });

      const result = await service.searchCity('Paris');

      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Paris');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('geocoding-api.open-meteo.com'),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('devrait utiliser le cache pour un second appel identique', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });

      await service.searchCity('Paris', 'fr', 5);
      const result = await service.searchCity('Paris', 'fr', 5);

      expect(result.results).toHaveLength(1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getForecast', () => {
    it('devrait retourner les previsions meteo', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastResponse),
      });

      const result = await service.getForecast(48.8566, 2.3522);

      expect(result.current.temperature_2m).toBe(18.5);
      expect(result.hourly.time).toHaveLength(1);
      expect(result.daily.time).toHaveLength(1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('devrait inclure les parametres enrichis dans la requete', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastResponse),
      });

      await service.getForecast(48.8566, 2.3522);

      const calledUrl = fetchSpy.mock.calls[0][0] as string;

      // Parametres horaires enrichis
      expect(calledUrl).toContain('relative_humidity_2m');
      expect(calledUrl).toContain('dew_point_2m');
      expect(calledUrl).toContain('pressure_msl');
      expect(calledUrl).toContain('uv_index');
      expect(calledUrl).toContain('wind_direction_10m');
      expect(calledUrl).toContain('wind_gusts_10m');
      expect(calledUrl).toContain('cloud_cover');
      expect(calledUrl).toContain('visibility');

      // Parametres journaliers enrichis
      expect(calledUrl).toContain('uv_index_max');
      expect(calledUrl).toContain('wind_speed_10m_max');
      expect(calledUrl).toContain('wind_gusts_10m_max');
      expect(calledUrl).toContain('wind_direction_10m_dominant');
    });

    it('devrait retourner les champs enrichis dans la reponse', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastResponse),
      });

      const result = await service.getForecast(48.8566, 2.3522);

      // Champs current enrichis
      expect(result.current.relative_humidity_2m).toBe(65);
      expect(result.current.pressure_msl).toBe(1013);
      expect(result.current.uv_index).toBe(5.2);
      expect(result.current.wind_direction_10m).toBe(180);
      expect(result.current.wind_gusts_10m).toBe(20.0);
      expect(result.current.cloud_cover).toBe(40);
      expect(result.current.visibility).toBe(10000);
      expect(result.current.dew_point_2m).toBe(11.3);

      // Champs hourly enrichis
      expect(result.hourly.relative_humidity_2m).toEqual([70]);
      expect(result.hourly.dew_point_2m).toEqual([10.0]);
      expect(result.hourly.pressure_msl).toEqual([1012]);
      expect(result.hourly.uv_index).toEqual([3.0]);

      // Champs daily enrichis
      expect(result.daily.uv_index_max).toEqual([6.0]);
      expect(result.daily.wind_speed_10m_max).toEqual([15.0]);
      expect(result.daily.wind_gusts_10m_max).toEqual([25.0]);
      expect(result.daily.wind_direction_10m_dominant).toEqual([190]);
    });

    it('devrait utiliser le cache pour un second appel identique', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastResponse),
      });

      await service.getForecast(48.8566, 2.3522, 'auto');
      const result = await service.getForecast(48.8566, 2.3522, 'auto');

      expect(result.current.temperature_2m).toBe(18.5);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAirQuality', () => {
    const mockAirQualityResponse = buildAirQualityResult();

    it("devrait retourner les donnees de qualite de l'air", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAirQualityResponse),
      });

      const result = await service.getAirQuality(48.8566, 2.3522);

      expect(result.current.european_aqi).toBe(42);
      expect(result.current.pm2_5).toBe(8.5);
      expect(result.current.pm10).toBe(15.2);
      expect(result.current.ozone).toBe(68.0);
      expect(result.current.nitrogen_dioxide).toBe(12.3);
      expect(result.current.sulphur_dioxide).toBe(3.1);
      expect(result.hourly.time).toHaveLength(2);
      expect(result.hourly.european_aqi).toEqual([40, 44]);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("devrait appeler l'API air-quality avec les bons parametres", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAirQualityResponse),
      });

      await service.getAirQuality(48.8566, 2.3522);

      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('air-quality-api.open-meteo.com');
      expect(calledUrl).toContain('european_aqi');
      expect(calledUrl).toContain('pm2_5');
      expect(calledUrl).toContain('pm10');
      expect(calledUrl).toContain('ozone');
      expect(calledUrl).toContain('nitrogen_dioxide');
      expect(calledUrl).toContain('sulphur_dioxide');
      expect(calledUrl).toContain('forecast_days=1');
    });

    it('devrait utiliser le cache pour un second appel identique', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAirQualityResponse),
      });

      await service.getAirQuality(48.8566, 2.3522);
      const result = await service.getAirQuality(48.8566, 2.3522);

      expect(result.current.european_aqi).toBe(42);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEnsemble', () => {
    const ecmwfResponse = {
      hourly: {
        time: ['2026-03-31T00:00', '2026-03-31T01:00'],
        temperature_2m: [14.0, 14.5],
        precipitation: [0.0, 0.1],
        wind_speed_10m: [8.0, 9.0],
      },
    };

    const gfsResponse = {
      hourly: {
        time: ['2026-03-31T00:00', '2026-03-31T01:00'],
        temperature_2m: [14.2, 14.8],
        precipitation: [0.0, 0.2],
        wind_speed_10m: [7.5, 8.5],
        cape: [120, 150],
      },
    };

    const iconResponse = {
      hourly: {
        time: ['2026-03-31T00:00', '2026-03-31T01:00'],
        temperature_2m: [13.8, 14.3],
        precipitation: [0.0, 0.0],
        wind_speed_10m: [8.2, 9.1],
      },
    };

    it('devrait retourner les trois modeles en parallele', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(ecmwfResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(gfsResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(iconResponse),
        });

      const result = await service.getEnsemble(48.8566, 2.3522);

      expect(result.models).toHaveLength(3);
      expect(result.models.map((m) => m.model)).toEqual([
        'ecmwf',
        'gfs',
        'icon',
      ]);
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it('devrait appeler les bonnes URLs pour chaque modele', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(ecmwfResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(gfsResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(iconResponse),
        });

      await service.getEnsemble(48.8566, 2.3522);

      const urls = fetchSpy.mock.calls.map((c) => c[0] as string);
      expect(urls[0]).toContain('api.open-meteo.com/v1/ecmwf');
      expect(urls[1]).toContain('api.open-meteo.com/v1/gfs');
      expect(urls[1]).toContain('cape');
      expect(urls[2]).toContain('api.open-meteo.com/v1/dwd-icon');
    });

    it('devrait inclure le CAPE dans le modele GFS', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(ecmwfResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(gfsResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(iconResponse),
        });

      const result = await service.getEnsemble(48.8566, 2.3522);

      const gfs = result.models.find((m) => m.model === 'gfs');
      expect(gfs?.hourly.cape).toEqual([120, 150]);

      const ecmwf = result.models.find((m) => m.model === 'ecmwf');
      expect(ecmwf?.hourly.cape).toBeUndefined();
    });

    it('devrait retourner les modeles reussis meme si un echoue', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(ecmwfResponse),
        })
        .mockRejectedValueOnce(new Error('GFS timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(iconResponse),
        });

      const result = await service.getEnsemble(48.8566, 2.3522);

      expect(result.models).toHaveLength(2);
      expect(result.models.map((m) => m.model)).toEqual(['ecmwf', 'icon']);
    });

    it('devrait retourner un resultat vide si tous les modeles echouent', async () => {
      fetchSpy
        .mockRejectedValueOnce(new Error('ECMWF down'))
        .mockRejectedValueOnce(new Error('GFS down'))
        .mockRejectedValueOnce(new Error('ICON down'));

      const result = await service.getEnsemble(48.8566, 2.3522);

      expect(result.models).toHaveLength(0);
    });

    it('devrait utiliser le cache pour un second appel identique', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(ecmwfResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(gfsResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(iconResponse),
        });

      await service.getEnsemble(48.8566, 2.3522);
      const result = await service.getEnsemble(48.8566, 2.3522);

      expect(result.models).toHaveLength(3);
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('getHistorical', () => {
    const mockHistoricalResponse = buildHistoricalResult();

    it('devrait retourner les donnees historiques', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoricalResponse),
      });

      const result = await service.getHistorical(
        48.8566,
        2.3522,
        '2025-01-01',
        '2025-01-03',
      );

      expect(result.daily.time).toHaveLength(3);
      expect(result.daily.temperature_2m_mean).toEqual([5.2, 4.8, 6.1]);
      expect(result.daily.temperature_2m_max).toEqual([8.0, 7.5, 9.2]);
      expect(result.daily.temperature_2m_min).toEqual([2.1, 1.9, 3.0]);
      expect(result.daily.precipitation_sum).toEqual([0.0, 2.5, 0.8]);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("devrait appeler l'API d'archives avec les bons parametres", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoricalResponse),
      });

      await service.getHistorical(48.8566, 2.3522, '2025-01-01', '2025-01-03');

      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('archive-api.open-meteo.com/v1/archive');
      expect(calledUrl).toContain('start_date=2025-01-01');
      expect(calledUrl).toContain('end_date=2025-01-03');
      expect(calledUrl).toContain('temperature_2m_mean');
      expect(calledUrl).toContain('temperature_2m_max');
      expect(calledUrl).toContain('temperature_2m_min');
      expect(calledUrl).toContain('precipitation_sum');
      expect(calledUrl).toContain('timezone=auto');
    });

    it('devrait utiliser le cache pour un second appel identique', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoricalResponse),
      });

      await service.getHistorical(48.8566, 2.3522, '2025-01-01', '2025-01-03');
      const result = await service.getHistorical(
        48.8566,
        2.3522,
        '2025-01-01',
        '2025-01-03',
      );

      expect(result.daily.time).toHaveLength(3);
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

      const promise = service.searchCity('Paris');
      jest.advanceTimersByTime(8_001);

      await expect(promise).rejects.toThrow('Open-Meteo timeout');

      jest.useRealTimers();
    });

    it('devrait lancer une erreur en cas de reponse HTTP non-OK', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(service.searchCity('Paris')).rejects.toThrow(
        'Open-Meteo HTTP 500',
      );
    });

    it('devrait lancer une erreur en cas de reponse HTTP non-OK pour air quality', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      await expect(service.getAirQuality(48.8566, 2.3522)).rejects.toThrow(
        'Open-Meteo HTTP 503',
      );
    });
  });
});
