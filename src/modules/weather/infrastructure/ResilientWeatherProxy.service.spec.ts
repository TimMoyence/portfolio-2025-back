import {
  buildDetailedCurrentWeather,
  buildDetailedForecastResult,
  buildDetailedHourlyItem,
  buildForecastResult,
  buildAirQualityResult,
} from '../../../../test/factories/weather.factory';
import type { IWeatherProxy } from '../domain/IWeatherProxy.port';
import type { IOpenWeatherMapProxy } from '../domain/IOpenWeatherMapProxy.port';
import { OpenMeteoProxyService } from './OpenMeteoProxy.service';
import { OpenWeatherMapProxyService } from './OpenWeatherMapProxy.service';
import { ResilientWeatherProxyService } from './ResilientWeatherProxy.service';

function createMockOpenMeteo(): jest.Mocked<
  Pick<OpenMeteoProxyService, keyof IWeatherProxy>
> {
  return {
    searchCity: jest.fn(),
    getForecast: jest.fn(),
    getAirQuality: jest.fn(),
    getEnsemble: jest.fn(),
    getHistorical: jest.fn(),
    getAlerts: jest.fn(),
  };
}

function createMockOwm(): jest.Mocked<
  Pick<OpenWeatherMapProxyService, keyof IOpenWeatherMapProxy>
> {
  return {
    getCurrentDetailed: jest.fn(),
    getForecastDetailed: jest.fn(),
  };
}

describe('ResilientWeatherProxyService', () => {
  let service: ResilientWeatherProxyService;
  let openMeteo: jest.Mocked<Pick<OpenMeteoProxyService, keyof IWeatherProxy>>;
  let owm: jest.Mocked<
    Pick<OpenWeatherMapProxyService, keyof IOpenWeatherMapProxy>
  >;

  beforeEach(() => {
    openMeteo = createMockOpenMeteo();
    owm = createMockOwm();
    service = new ResilientWeatherProxyService(
      openMeteo as unknown as OpenMeteoProxyService,
      owm as unknown as OpenWeatherMapProxyService,
    );
  });

  describe('getForecast', () => {
    it('utilise Open-Meteo directement quand le circuit est ferme', async () => {
      const expected = buildForecastResult();
      openMeteo.getForecast.mockResolvedValue(expected);

      const result = await service.getForecast(48.85, 2.35);

      expect(result).toBe(expected);
      expect(openMeteo.getForecast).toHaveBeenCalledWith(
        48.85,
        2.35,
        undefined,
        undefined,
      );
      expect(owm.getCurrentDetailed).not.toHaveBeenCalled();
    });

    it('bascule vers OWM en fallback quand Open-Meteo echoue', async () => {
      openMeteo.getForecast.mockRejectedValue(new Error('Open-Meteo down'));
      owm.getCurrentDetailed.mockResolvedValue(buildDetailedCurrentWeather());
      owm.getForecastDetailed.mockResolvedValue(buildDetailedForecastResult());

      const result = await service.getForecast(48.85, 2.35);

      expect(openMeteo.getForecast).toHaveBeenCalled();
      expect(owm.getCurrentDetailed).toHaveBeenCalledWith(48.85, 2.35);
      expect(owm.getForecastDetailed).toHaveBeenCalledWith(48.85, 2.35);
      expect(result.current.temperature_2m).toBe(18.5);
      expect(result.current.apparent_temperature).toBe(17.2);
    });

    it('relance l erreur si OWM echoue aussi', async () => {
      openMeteo.getForecast.mockRejectedValue(new Error('Open-Meteo down'));
      owm.getCurrentDetailed.mockRejectedValue(new Error('OWM down'));

      await expect(service.getForecast(48.85, 2.35)).rejects.toThrow(
        'OWM down',
      );
    });

    it('ouvre le circuit Open-Meteo apres 3 echecs et appelle OWM directement', async () => {
      openMeteo.getForecast.mockRejectedValue(new Error('Open-Meteo down'));
      owm.getCurrentDetailed.mockResolvedValue(buildDetailedCurrentWeather());
      owm.getForecastDetailed.mockResolvedValue(buildDetailedForecastResult());

      await service.getForecast(48.85, 2.35);
      await service.getForecast(48.85, 2.35);
      await service.getForecast(48.85, 2.35);

      expect(openMeteo.getForecast).toHaveBeenCalledTimes(3);
      openMeteo.getForecast.mockClear();

      await service.getForecast(48.85, 2.35);
      expect(openMeteo.getForecast).not.toHaveBeenCalled();
      expect(owm.getCurrentDetailed).toHaveBeenCalled();
    });

    it('referme le circuit apres succes en HALF_OPEN', async () => {
      openMeteo.getForecast.mockRejectedValue(new Error('Open-Meteo down'));
      owm.getCurrentDetailed.mockResolvedValue(buildDetailedCurrentWeather());
      owm.getForecastDetailed.mockResolvedValue(buildDetailedForecastResult());

      await service.getForecast(48.85, 2.35);
      await service.getForecast(48.85, 2.35);
      await service.getForecast(48.85, 2.35);

      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000);

      const expected = buildForecastResult();
      openMeteo.getForecast.mockResolvedValue(expected);

      const result1 = await service.getForecast(48.85, 2.35);
      expect(result1).toBe(expected);

      const result2 = await service.getForecast(48.85, 2.35);
      expect(result2).toBe(expected);
    });
  });

  describe('searchCity', () => {
    it('utilise Open-Meteo et retourne le resultat', async () => {
      const expected = {
        results: [
          {
            id: 1,
            name: 'Paris',
            latitude: 48.85,
            longitude: 2.35,
            country: 'France',
            country_code: 'FR',
          },
        ],
      };
      openMeteo.searchCity.mockResolvedValue(expected);

      const result = await service.searchCity('Paris');

      expect(result).toBe(expected);
      expect(openMeteo.searchCity).toHaveBeenCalledWith(
        'Paris',
        undefined,
        undefined,
      );
    });

    it('relance l erreur sans fallback si Open-Meteo echoue', async () => {
      openMeteo.searchCity.mockRejectedValue(new Error('Open-Meteo down'));

      await expect(service.searchCity('Paris')).rejects.toThrow(
        'Open-Meteo down',
      );
      expect(owm.getCurrentDetailed).not.toHaveBeenCalled();
    });
  });

  describe('getAirQuality', () => {
    it('utilise Open-Meteo et retourne le resultat', async () => {
      const expected = buildAirQualityResult();
      openMeteo.getAirQuality.mockResolvedValue(expected);

      const result = await service.getAirQuality(48.85, 2.35);

      expect(result).toBe(expected);
    });

    it('relance l erreur sans fallback si Open-Meteo echoue', async () => {
      openMeteo.getAirQuality.mockRejectedValue(new Error('Open-Meteo down'));

      await expect(service.getAirQuality(48.85, 2.35)).rejects.toThrow(
        'Open-Meteo down',
      );
    });
  });

  describe('getEnsemble', () => {
    it('relance l erreur sans fallback si Open-Meteo echoue', async () => {
      openMeteo.getEnsemble.mockRejectedValue(new Error('Open-Meteo down'));

      await expect(service.getEnsemble(48.85, 2.35)).rejects.toThrow(
        'Open-Meteo down',
      );
    });
  });

  describe('getHistorical', () => {
    it('relance l erreur sans fallback si Open-Meteo echoue', async () => {
      openMeteo.getHistorical.mockRejectedValue(new Error('Open-Meteo down'));

      await expect(
        service.getHistorical(48.85, 2.35, '2025-01-01', '2025-01-31'),
      ).rejects.toThrow('Open-Meteo down');
    });
  });

  describe('circuit ouvert sans fallback', () => {
    it('lance une erreur pour searchCity si le circuit Open-Meteo est ouvert', async () => {
      openMeteo.searchCity.mockRejectedValue(new Error('down'));

      await expect(service.searchCity('A')).rejects.toThrow();
      await expect(service.searchCity('B')).rejects.toThrow();
      await expect(service.searchCity('C')).rejects.toThrow();

      await expect(service.searchCity('D')).rejects.toThrow(
        'Circuit Open-Meteo ouvert',
      );
      expect(openMeteo.searchCity).toHaveBeenCalledTimes(3);
    });
  });

  describe('mapping OWM vers ForecastResult', () => {
    it('mappe correctement les donnees OWM vers le format Open-Meteo', async () => {
      openMeteo.getForecast.mockRejectedValue(new Error('down'));
      owm.getCurrentDetailed.mockResolvedValue(
        buildDetailedCurrentWeather({
          temperatureCelsius: 20.0,
          feelsLikeCelsius: 19.0,
          humidityPercent: 55,
          windSpeedKmh: 15.0,
          windDirectionDegrees: 270,
          windGustKmh: 25.0,
          cloudCoverPercent: 60,
          visibilityKm: 8,
          seaLevelPressureHpa: 1015,
          conditionId: 800,
        }),
      );
      owm.getForecastDetailed.mockResolvedValue(
        buildDetailedForecastResult({
          hourly: [
            {
              timeIso: '2026-03-31T12:00:00.000Z',
              temperatureCelsius: 20.0,
              feelsLikeCelsius: 19.0,
              humidityPercent: 55,
              seaLevelPressureHpa: 1015,
              groundLevelPressureHpa: 1012,
              windSpeedKmh: 15.0,
              windGustKmh: 25.0,
              windDirectionDegrees: 270,
              cloudCoverPercent: 60,
              visibilityKm: 8,
              rain3hMm: 1.5,
              snow3hMm: 0,
              precipitationProbabilityPercent: 40,
              conditionId: 500,
              conditionName: 'Rain',
              conditionText: 'pluie legere',
              conditionIcon: 'https://openweathermap.org/img/wn/10d@2x.png',
              partOfDay: 'd',
            },
          ],
          daily: [
            {
              dateIso: '2026-03-31',
              minTempCelsius: 15.0,
              maxTempCelsius: 22.0,
              conditionId: 500,
              conditionName: 'Rain',
              conditionText: 'pluie legere',
              conditionIcon: 'https://openweathermap.org/img/wn/10d@2x.png',
            },
          ],
        }),
      );

      const result = await service.getForecast(48.85, 2.35);

      expect(result.current.temperature_2m).toBe(20.0);
      expect(result.current.apparent_temperature).toBe(19.0);
      expect(result.current.wind_speed_10m).toBe(15.0);
      expect(result.current.weather_code).toBe(0);
      expect(result.current.visibility).toBe(8_000);

      expect(result.hourly.time).toEqual(['2026-03-31T12:00:00.000Z']);
      expect(result.hourly.temperature_2m).toEqual([20.0]);
      expect(result.hourly.weather_code).toEqual([61]);
      expect(result.hourly.precipitation).toEqual([1.5]);

      expect(result.daily.time).toEqual(['2026-03-31']);
      expect(result.daily.temperature_2m_max).toEqual([22.0]);
      expect(result.daily.temperature_2m_min).toEqual([15.0]);
    });

    it('convertit la visibilite des kilometres OWM vers les metres Open-Meteo', async () => {
      openMeteo.getForecast.mockRejectedValue(new Error('down'));
      owm.getCurrentDetailed.mockResolvedValue(
        buildDetailedCurrentWeather({ visibilityKm: 8 }),
      );
      owm.getForecastDetailed.mockResolvedValue(
        buildDetailedForecastResult({
          hourly: [buildDetailedHourlyItem({ visibilityKm: 4.5 })],
        }),
      );

      const result = await service.getForecast(48.85, 2.35);

      expect(result.current.visibility).toBe(8_000);
      expect(result.hourly.visibility).toEqual([4_500]);
    });

    it('laisse intactes les grandeurs deja exprimees dans les unites Open-Meteo', async () => {
      openMeteo.getForecast.mockRejectedValue(new Error('down'));
      owm.getCurrentDetailed.mockResolvedValue(
        buildDetailedCurrentWeather({
          windSpeedKmh: 15,
          windGustKmh: 25,
          seaLevelPressureHpa: 1015,
          temperatureCelsius: 20,
        }),
      );
      owm.getForecastDetailed.mockResolvedValue(buildDetailedForecastResult());

      const result = await service.getForecast(48.85, 2.35);

      expect(result.current.wind_speed_10m).toBe(15);
      expect(result.current.wind_gusts_10m).toBe(25);
      expect(result.current.pressure_msl).toBe(1015);
      expect(result.current.temperature_2m).toBe(20);
    });
  });

  /**
   * Verrou de la chaine complete des unites de visibilite.
   *
   * OWM publie des metres, le port les expose en kilometres, et le contrat
   * Open-Meteo attend de nouveau des metres. Les deux conversions doivent donc
   * rester exactement inverses l'une de l'autre : les tests unitaires de chaque
   * proxy verifient une moitie du trajet, celui-ci verifie qu'elles se composent.
   */
  describe('coherence des unites de visibilite de bout en bout', () => {
    const VISIBILITY_METRES = 8_000;

    function buildOwmSample(overrides: Record<string, unknown> = {}) {
      return {
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
        visibility: VISIBILITY_METRES,
        sys: { sunrise: 1743400800, sunset: 1743449400 },
        timezone: 3600,
        ...overrides,
      };
    }

    it('restitue en metres les metres renvoyes par OpenWeatherMap', async () => {
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation((input) => {
          const url =
            typeof input === 'string'
              ? input
              : input instanceof URL
                ? input.href
                : input.url;
          const payload = url.includes('/data/2.5/forecast')
            ? {
                list: [buildOwmSample({ pop: 0.1 })],
                city: {
                  name: 'Paris',
                  country: 'FR',
                  coord: { lat: 48.85, lon: 2.35 },
                  timezone: 3600,
                },
              }
            : buildOwmSample();

          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(payload),
          } as Response);
        });

      try {
        openMeteo.getForecast.mockRejectedValue(new Error('down'));
        const realOwm = new OpenWeatherMapProxyService('test-api-key');
        const chain = new ResilientWeatherProxyService(
          openMeteo as unknown as OpenMeteoProxyService,
          realOwm,
        );

        const result = await chain.getForecast(48.85, 2.35);

        expect(result.current.visibility).toBe(VISIBILITY_METRES);
        expect(result.hourly.visibility).toEqual([VISIBILITY_METRES]);
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });
});
