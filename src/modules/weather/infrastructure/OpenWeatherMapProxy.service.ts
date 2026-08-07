import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  DetailedCurrentWeather,
  DetailedDailyItem,
  DetailedForecastResult,
  DetailedHourlyItem,
  IOpenWeatherMapProxy,
} from '../domain/IOpenWeatherMapProxy.port';
import { OPENWEATHERMAP_API_KEY } from '../domain/token';
import { WeatherCache } from './weather-cache';

const FETCH_TIMEOUT_MS = 8_000;

const CURRENT_TTL_MS = 10 * 60 * 1_000;

const FORECAST_TTL_MS = 30 * 60 * 1_000;

const OWM_BASE = 'https://api.openweathermap.org';

const MS_TO_KMH = 3.6;

const METRES_PER_KILOMETRE = 1_000;

/** Convertit les metres renvoyes par OWM en kilometres exposes par le port. */
function metresToKilometres(metres: number): number {
  return metres / METRES_PER_KILOMETRE;
}

/**
 * Proxy OpenWeatherMap pour les donnees meteo detaillees.
 * Utilise l'API 2.5 (current + forecast 5 jours / 3 heures).
 */
@Injectable()
export class OpenWeatherMapProxyService implements IOpenWeatherMapProxy {
  private readonly logger = new Logger(OpenWeatherMapProxyService.name);
  private readonly cache = new WeatherCache();

  constructor(
    @Inject(OPENWEATHERMAP_API_KEY)
    private readonly apiKey: string,
  ) {}

  async getCurrentDetailed(
    latitude: number,
    longitude: number,
  ): Promise<DetailedCurrentWeather> {
    const cacheKey = `owm:current:${latitude}:${longitude}`;
    const cached = this.cache.get<DetailedCurrentWeather>(cacheKey);
    if (cached) return cached;

    const url =
      `${OWM_BASE}/data/2.5/weather?lat=${latitude}&lon=${longitude}` +
      `&units=metric&appid=${this.apiKey}&lang=fr`;

    const data = await this.fetchJson<OWMCurrentResponse>(url);
    const result = this.mapCurrentResponse(data);
    this.cache.set(cacheKey, result, CURRENT_TTL_MS);
    return result;
  }

  async getForecastDetailed(
    latitude: number,
    longitude: number,
  ): Promise<DetailedForecastResult> {
    const cacheKey = `owm:forecast:${latitude}:${longitude}`;
    const cached = this.cache.get<DetailedForecastResult>(cacheKey);
    if (cached) return cached;

    const url =
      `${OWM_BASE}/data/2.5/forecast?lat=${latitude}&lon=${longitude}` +
      `&units=metric&appid=${this.apiKey}&lang=fr`;

    const data = await this.fetchJson<OWMForecastResponse>(url);
    const result = this.mapForecastResponse(data);
    this.cache.set(cacheKey, result, FORECAST_TTL_MS);
    return result;
  }

  private mapCurrentResponse(data: OWMCurrentResponse): DetailedCurrentWeather {
    const weather = data.weather?.[0];
    const now = data.dt;
    const isDaytime = now >= data.sys.sunrise && now < data.sys.sunset;

    return {
      temperatureCelsius: data.main.temp,
      feelsLikeCelsius: data.main.feels_like,
      minTempCelsius: data.main.temp_min,
      maxTempCelsius: data.main.temp_max,
      humidityPercent: data.main.humidity,
      seaLevelPressureHpa: data.main.sea_level ?? data.main.pressure,
      groundLevelPressureHpa: data.main.grnd_level ?? data.main.pressure,
      windSpeedKmh: data.wind.speed * MS_TO_KMH,
      windGustKmh: (data.wind.gust ?? 0) * MS_TO_KMH,
      windDirectionDegrees: data.wind.deg,
      cloudCoverPercent: data.clouds.all,
      visibilityKm: metresToKilometres(data.visibility ?? 10_000),
      rain1hMm: data.rain?.['1h'] ?? 0,
      snow1hMm: data.snow?.['1h'] ?? 0,
      precipitationProbabilityPercent: 0,
      conditionId: weather?.id ?? 0,
      conditionName: weather?.main ?? '',
      conditionText: weather?.description ?? '',
      conditionIcon: weather
        ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
        : '',
      sunriseIso: new Date(data.sys.sunrise * 1_000).toISOString(),
      sunsetIso: new Date(data.sys.sunset * 1_000).toISOString(),
      isDaytime,
      partOfDay: isDaytime ? 'd' : 'n',
      timezoneOffsetSeconds: data.timezone,
    };
  }

  private mapForecastResponse(
    data: OWMForecastResponse,
  ): DetailedForecastResult {
    const hourly: DetailedHourlyItem[] = data.list.map((item) => {
      const weather = item.weather?.[0];
      return {
        timeIso: new Date(item.dt * 1_000).toISOString(),
        temperatureCelsius: item.main.temp,
        feelsLikeCelsius: item.main.feels_like,
        humidityPercent: item.main.humidity,
        seaLevelPressureHpa: item.main.sea_level ?? item.main.pressure,
        groundLevelPressureHpa: item.main.grnd_level ?? item.main.pressure,
        windSpeedKmh: item.wind.speed * MS_TO_KMH,
        windGustKmh: (item.wind.gust ?? 0) * MS_TO_KMH,
        windDirectionDegrees: item.wind.deg,
        cloudCoverPercent: item.clouds.all,
        visibilityKm: metresToKilometres(item.visibility ?? 10_000),
        rain3hMm: item.rain?.['3h'] ?? 0,
        snow3hMm: item.snow?.['3h'] ?? 0,
        precipitationProbabilityPercent: Math.round((item.pop ?? 0) * 100),
        conditionId: weather?.id ?? 0,
        conditionName: weather?.main ?? '',
        conditionText: weather?.description ?? '',
        conditionIcon: weather
          ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
          : '',
        partOfDay: weather?.icon?.endsWith('n') ? 'n' : 'd',
      };
    });

    const daily = this.aggregateDaily(hourly);

    return {
      cityName: data.city.name,
      country: data.city.country,
      latitude: data.city.coord.lat,
      longitude: data.city.coord.lon,
      timezoneOffsetSeconds: data.city.timezone,
      hourly,
      daily,
    };
  }

  private aggregateDaily(hourly: DetailedHourlyItem[]): DetailedDailyItem[] {
    const byDay = new Map<string, DetailedHourlyItem[]>();

    for (const item of hourly) {
      const date = item.timeIso.slice(0, 10);
      const existing = byDay.get(date);
      if (existing) {
        existing.push(item);
      } else {
        byDay.set(date, [item]);
      }
    }

    const result: DetailedDailyItem[] = [];
    for (const [date, items] of byDay) {
      const temps = items.map((i) => i.temperatureCelsius);
      const midItem =
        items.find((i) => i.timeIso.includes('T12:')) ??
        items.find((i) => i.timeIso.includes('T15:')) ??
        items[0];

      result.push({
        dateIso: date,
        minTempCelsius: Math.min(...temps),
        maxTempCelsius: Math.max(...temps),
        conditionId: midItem.conditionId,
        conditionName: midItem.conditionName,
        conditionText: midItem.conditionText,
        conditionIcon: midItem.conditionIcon,
      });
    }

    return result;
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`OpenWeatherMap HTTP ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        this.logger.warn(
          `Timeout apres ${FETCH_TIMEOUT_MS}ms pour OpenWeatherMap`,
        );
        throw new Error(`OpenWeatherMap timeout (${FETCH_TIMEOUT_MS}ms)`);
      }
      const safeMessage =
        error instanceof Error
          ? error.message.replace(/appid=[^&\s]+/g, 'appid=***')
          : 'Unknown error';
      this.logger.warn(`Erreur OpenWeatherMap: ${safeMessage}`);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

interface OWMWeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface OWMMainData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  sea_level?: number;
  grnd_level?: number;
}

interface OWMWindData {
  speed: number;
  deg: number;
  gust?: number;
}

interface OWMCurrentResponse {
  dt: number;
  main: OWMMainData;
  weather: OWMWeatherCondition[];
  wind: OWMWindData;
  clouds: { all: number };
  visibility?: number;
  rain?: { '1h'?: number };
  snow?: { '1h'?: number };
  sys: { sunrise: number; sunset: number };
  timezone: number;
}

interface OWMForecastItem {
  dt: number;
  main: OWMMainData;
  weather: OWMWeatherCondition[];
  wind: OWMWindData;
  clouds: { all: number };
  visibility?: number;
  rain?: { '3h'?: number };
  snow?: { '3h'?: number };
  pop?: number;
}

interface OWMForecastResponse {
  list: OWMForecastItem[];
  city: {
    name: string;
    country: string;
    coord: { lat: number; lon: number };
    timezone: number;
  };
}
