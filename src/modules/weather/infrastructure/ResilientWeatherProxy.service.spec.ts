import {
  buildDetailedCurrentWeather,
  buildDetailedForecastResult,
  buildForecastResult,
  buildAirQualityResult,
} from '../../../../test/factories/weather.factory';
import type { IWeatherProxy } from '../domain/IWeatherProxy.port';
import type { IOpenWeatherMapProxy } from '../domain/IOpenWeatherMapProxy.port';
import { OpenMeteoProxyService } from './OpenMeteoProxy.service';
import { OpenWeatherMapProxyService } from './OpenWeatherMapProxy.service';
import { ResilientWeatherProxyService } from './ResilientWeatherProxy.service';

/** Cree un mock du service OpenMeteoProxyService. */
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

/** Cree un mock du service OpenWeatherMapProxyService. */
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
      // Verifier que le resultat mappe contient les bonnes donnees
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

      // 3 echecs pour ouvrir le circuit
      await service.getForecast(48.85, 2.35);
      await service.getForecast(48.85, 2.35);
      await service.getForecast(48.85, 2.35);

      expect(openMeteo.getForecast).toHaveBeenCalledTimes(3);
      openMeteo.getForecast.mockClear();

      // 4e appel : circuit ouvert, va directement a OWM
      await service.getForecast(48.85, 2.35);
      expect(openMeteo.getForecast).not.toHaveBeenCalled();
      expect(owm.getCurrentDetailed).toHaveBeenCalled();
    });

    it('referme le circuit apres succes en HALF_OPEN', async () => {
      openMeteo.getForecast.mockRejectedValue(new Error('Open-Meteo down'));
      owm.getCurrentDetailed.mockResolvedValue(buildDetailedCurrentWeather());
      owm.getForecastDetailed.mockResolvedValue(buildDetailedForecastResult());

      // Ouvrir le circuit (3 echecs)
      await service.getForecast(48.85, 2.35);
      await service.getForecast(48.85, 2.35);
      await service.getForecast(48.85, 2.35);

      // Simuler l'expiration du timeout pour passer en HALF_OPEN
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000);

      // Open-Meteo fonctionne a nouveau
      const expected = buildForecastResult();
      openMeteo.getForecast.mockResolvedValue(expected);

      // Premier et deuxieme succes en HALF_OPEN → referme le circuit
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
      // Ouvrir le circuit avec 3 echecs via searchCity
      openMeteo.searchCity.mockRejectedValue(new Error('down'));

      await expect(service.searchCity('A')).rejects.toThrow();
      await expect(service.searchCity('B')).rejects.toThrow();
      await expect(service.searchCity('C')).rejects.toThrow();

      // Circuit ouvert — les appels suivants echouent immediatement
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
          temperature: 20.0,
          feelsLike: 19.0,
          humidity: 55,
          windSpeed: 15.0,
          windDirection: 270,
          windGust: 25.0,
          cloudCover: 60,
          visibility: 8,
          seaLevelPressure: 1015,
          conditionId: 800,
        }),
      );
      owm.getForecastDetailed.mockResolvedValue(
        buildDetailedForecastResult({
          hourly: [
            {
              time: '2026-03-31T12:00:00.000Z',
              temperature: 20.0,
              feelsLike: 19.0,
              humidity: 55,
              seaLevelPressure: 1015,
              groundLevelPressure: 1012,
              windSpeed: 15.0,
              windGust: 25.0,
              windDirection: 270,
              cloudCover: 60,
              visibility: 8,
              rain3h: 1.5,
              snow3h: 0,
              precipitationProbability: 40,
              conditionId: 500,
              conditionName: 'Rain',
              conditionText: 'pluie legere',
              conditionIcon: 'https://openweathermap.org/img/wn/10d@2x.png',
              partOfDay: 'd',
            },
          ],
          daily: [
            {
              date: '2026-03-31',
              minTemp: 15.0,
              maxTemp: 22.0,
              conditionId: 500,
              conditionName: 'Rain',
              conditionText: 'pluie legere',
              conditionIcon: 'https://openweathermap.org/img/wn/10d@2x.png',
            },
          ],
        }),
      );

      const result = await service.getForecast(48.85, 2.35);

      // Donnees courantes
      expect(result.current.temperature_2m).toBe(20.0);
      expect(result.current.apparent_temperature).toBe(19.0);
      expect(result.current.wind_speed_10m).toBe(15.0);
      expect(result.current.weather_code).toBe(0); // 800 → WMO 0 (clair)
      expect(result.current.visibility).toBe(8_000); // 8 km → 8000 m

      // Donnees horaires
      expect(result.hourly.time).toEqual(['2026-03-31T12:00:00.000Z']);
      expect(result.hourly.temperature_2m).toEqual([20.0]);
      expect(result.hourly.weather_code).toEqual([61]); // 500 → WMO 61 (pluie)
      expect(result.hourly.precipitation).toEqual([1.5]); // rain3h + snow3h

      // Donnees journalieres
      expect(result.daily.time).toEqual(['2026-03-31']);
      expect(result.daily.temperature_2m_max).toEqual([22.0]);
      expect(result.daily.temperature_2m_min).toEqual([15.0]);
    });
  });
});
