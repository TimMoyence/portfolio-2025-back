import type { IOpenWeatherMapProxy } from '../../src/modules/weather/domain/IOpenWeatherMapProxy.port';
import type {
  DetailedCurrentWeather,
  DetailedForecastResult,
  DetailedHourlyItem,
  DetailedDailyItem,
} from '../../src/modules/weather/domain/IOpenWeatherMapProxy.port';
import type { IWeatherPreferencesRepository } from '../../src/modules/weather/domain/IWeatherPreferences.repository';
import type {
  AirQualityResult,
  EnsembleResult,
  ForecastResult,
  HistoricalResult,
  IWeatherProxy,
} from '../../src/modules/weather/domain/IWeatherProxy.port';
import { WeatherUserPreferences } from '../../src/modules/weather/domain/WeatherUserPreferences';
import type {
  UnitPreferences,
  WeatherLevel,
} from '../../src/modules/weather/domain/WeatherUserPreferences';

/** Construit un objet WeatherUserPreferences avec des valeurs par defaut. */
export function buildWeatherPreferences(
  overrides?: Partial<{
    id: string;
    userId: string;
    level: WeatherLevel;
    favoriteCities: {
      name: string;
      latitude: number;
      longitude: number;
      country: string;
    }[];
    daysUsed: number;
    lastUsedAt: Date | null;
    tooltipsSeen: string[];
    units: UnitPreferences;
    createdAt: Date;
    updatedAt: Date;
  }>,
): WeatherUserPreferences {
  const now = new Date('2026-03-31T12:00:00Z');
  return WeatherUserPreferences.fromPersistence({
    id: overrides?.id ?? 'prefs-1',
    userId: overrides?.userId ?? 'user-1',
    level: overrides?.level ?? 'discovery',
    favoriteCities: overrides?.favoriteCities ?? [],
    daysUsed: overrides?.daysUsed ?? 0,
    lastUsedAt: overrides?.lastUsedAt ?? null,
    tooltipsSeen: overrides?.tooltipsSeen ?? [],
    units: overrides?.units ?? {
      temperature: 'celsius',
      speed: 'kmh',
      pressure: 'hpa',
    },
    createdAt: overrides?.createdAt ?? now,
    updatedAt: overrides?.updatedAt ?? now,
  });
}

/** Cree un mock du repository de preferences meteo avec tous les jest.fn(). */
export function createMockWeatherPreferencesRepo(): jest.Mocked<IWeatherPreferencesRepository> {
  return {
    findByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
}

/** Construit un objet DetailedCurrentWeather avec des valeurs par defaut. */
export function buildDetailedCurrentWeather(
  overrides?: Partial<DetailedCurrentWeather>,
): DetailedCurrentWeather {
  return {
    temperature: 18.5,
    feelsLike: 17.2,
    minTemp: 14.0,
    maxTemp: 22.0,
    humidity: 65,
    seaLevelPressure: 1013,
    groundLevelPressure: 1010,
    windSpeed: 12.6,
    windGust: 20.0,
    windDirection: 180,
    cloudCover: 40,
    visibility: 10,
    rain1h: 0,
    snow1h: 0,
    precipitationProbability: 0,
    conditionId: 800,
    conditionName: 'Clear',
    conditionText: 'ciel degage',
    conditionIcon: 'https://openweathermap.org/img/wn/01d@2x.png',
    sunrise: '2026-03-31T06:00:00.000Z',
    sunset: '2026-03-31T19:30:00.000Z',
    isDaytime: true,
    partOfDay: 'd',
    timezoneOffset: 3600,
    ...overrides,
  };
}

/** Construit un element horaire detaille par defaut. */
export function buildDetailedHourlyItem(
  overrides?: Partial<DetailedHourlyItem>,
): DetailedHourlyItem {
  return {
    time: '2026-03-31T12:00:00.000Z',
    temperature: 18.5,
    feelsLike: 17.2,
    humidity: 65,
    seaLevelPressure: 1013,
    groundLevelPressure: 1010,
    windSpeed: 12.6,
    windGust: 20.0,
    windDirection: 180,
    cloudCover: 40,
    visibility: 10,
    rain3h: 0,
    snow3h: 0,
    precipitationProbability: 0,
    conditionId: 800,
    conditionName: 'Clear',
    conditionText: 'ciel degage',
    conditionIcon: 'https://openweathermap.org/img/wn/01d@2x.png',
    partOfDay: 'd',
    ...overrides,
  };
}

/** Construit un element journalier detaille par defaut. */
export function buildDetailedDailyItem(
  overrides?: Partial<DetailedDailyItem>,
): DetailedDailyItem {
  return {
    date: '2026-03-31',
    minTemp: 14.0,
    maxTemp: 22.0,
    conditionId: 800,
    conditionName: 'Clear',
    conditionText: 'ciel degage',
    conditionIcon: 'https://openweathermap.org/img/wn/01d@2x.png',
    ...overrides,
  };
}

/** Construit un resultat de previsions detaillees par defaut. */
export function buildDetailedForecastResult(
  overrides?: Partial<DetailedForecastResult>,
): DetailedForecastResult {
  return {
    cityName: 'Paris',
    country: 'FR',
    latitude: 48.8566,
    longitude: 2.3522,
    timezoneOffset: 3600,
    hourly: [buildDetailedHourlyItem()],
    daily: [buildDetailedDailyItem()],
    ...overrides,
  };
}

/** Cree un mock du proxy OpenWeatherMap avec tous les jest.fn(). */
export function createMockOpenWeatherMapProxy(): jest.Mocked<IOpenWeatherMapProxy> {
  return {
    getCurrentDetailed: jest.fn(),
    getForecastDetailed: jest.fn(),
  };
}

/** Construit un resultat de qualite de l'air avec des valeurs par defaut. */
export function buildAirQualityResult(
  overrides?: Partial<AirQualityResult>,
): AirQualityResult {
  return {
    current: {
      european_aqi: 42,
      pm2_5: 8.5,
      pm10: 15.2,
      ozone: 68.0,
      nitrogen_dioxide: 12.3,
      sulphur_dioxide: 3.1,
      ...overrides?.current,
    },
    hourly: {
      time: ['2026-03-31T00:00', '2026-03-31T01:00'],
      european_aqi: [40, 44],
      pm2_5: [8.0, 9.0],
      pm10: [14.0, 16.0],
      ozone: [65.0, 70.0],
      ...overrides?.hourly,
    },
  };
}

/** Construit un resultat de previsions enrichi avec des valeurs par defaut. */
export function buildForecastResult(
  overrides?: Partial<ForecastResult>,
): ForecastResult {
  return {
    current: {
      temperature_2m: 18.5,
      weather_code: 0,
      wind_speed_10m: 12.3,
      apparent_temperature: 17.2,
      relative_humidity_2m: 65,
      pressure_msl: 1013,
      uv_index: 5.2,
      wind_direction_10m: 180,
      wind_gusts_10m: 20.0,
      cloud_cover: 40,
      visibility: 10000,
      dew_point_2m: 11.3,
      ...overrides?.current,
    },
    hourly: {
      time: ['2026-03-31T00:00'],
      temperature_2m: [15.0],
      weather_code: [0],
      wind_speed_10m: [10.0],
      precipitation: [0.0],
      relative_humidity_2m: [70],
      dew_point_2m: [10.0],
      pressure_msl: [1012],
      uv_index: [3.0],
      wind_direction_10m: [200],
      wind_gusts_10m: [18.0],
      cloud_cover: [30],
      visibility: [10000],
      ...overrides?.hourly,
    },
    daily: {
      time: ['2026-03-31'],
      weather_code: [0],
      temperature_2m_max: [20.0],
      temperature_2m_min: [10.0],
      sunrise: ['2026-03-31T07:00'],
      sunset: ['2026-03-31T19:30'],
      precipitation_sum: [0.0],
      uv_index_max: [6.0],
      wind_speed_10m_max: [15.0],
      wind_gusts_10m_max: [25.0],
      wind_direction_10m_dominant: [190],
      ...overrides?.daily,
    },
  };
}

/** Construit un resultat d'ensemble multi-modeles avec des valeurs par defaut. */
export function buildEnsembleResult(
  overrides?: Partial<EnsembleResult>,
): EnsembleResult {
  return {
    models: overrides?.models ?? [
      {
        model: 'ecmwf',
        hourly: {
          time: ['2026-03-31T00:00', '2026-03-31T01:00'],
          temperature_2m: [14.0, 14.5],
          precipitation: [0.0, 0.1],
          wind_speed_10m: [8.0, 9.0],
        },
      },
      {
        model: 'gfs',
        hourly: {
          time: ['2026-03-31T00:00', '2026-03-31T01:00'],
          temperature_2m: [14.2, 14.8],
          precipitation: [0.0, 0.2],
          wind_speed_10m: [7.5, 8.5],
          cape: [120, 150],
        },
      },
      {
        model: 'icon',
        hourly: {
          time: ['2026-03-31T00:00', '2026-03-31T01:00'],
          temperature_2m: [13.8, 14.3],
          precipitation: [0.0, 0.0],
          wind_speed_10m: [8.2, 9.1],
        },
      },
    ],
  };
}

/** Construit un resultat de donnees historiques avec des valeurs par defaut. */
export function buildHistoricalResult(
  overrides?: Partial<HistoricalResult>,
): HistoricalResult {
  return {
    daily: {
      time: ['2025-01-01', '2025-01-02', '2025-01-03'],
      temperature_2m_mean: [5.2, 4.8, 6.1],
      temperature_2m_max: [8.0, 7.5, 9.2],
      temperature_2m_min: [2.1, 1.9, 3.0],
      precipitation_sum: [0.0, 2.5, 0.8],
      ...overrides?.daily,
    },
  };
}

/** Cree un mock du proxy meteo Open-Meteo avec tous les jest.fn(). */
export function createMockWeatherProxy(): jest.Mocked<IWeatherProxy> {
  return {
    searchCity: jest.fn(),
    getForecast: jest.fn(),
    getAirQuality: jest.fn(),
    getEnsemble: jest.fn(),
    getHistorical: jest.fn(),
  };
}
