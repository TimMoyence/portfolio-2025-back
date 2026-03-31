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

/** Delai d'attente maximal pour les appels OpenWeatherMap (ms). */
const FETCH_TIMEOUT_MS = 8_000;

/** TTL du cache pour les donnees courantes (10 minutes). */
const CURRENT_TTL_MS = 10 * 60 * 1_000;

/** TTL du cache pour les previsions (30 minutes). */
const FORECAST_TTL_MS = 30 * 60 * 1_000;

/** URL de base de l'API OpenWeatherMap. */
const OWM_BASE = 'https://api.openweathermap.org';

/** Facteur de conversion m/s vers km/h. */
const MS_TO_KMH = 3.6;

/** Facteur de conversion metres vers kilometres. */
const M_TO_KM = 1_000;

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

  /** Recupere les donnees meteo detaillees courantes. */
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

  /** Recupere les previsions detaillees. */
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

  /** Convertit la reponse current de l'API OWM en objet de domaine. */
  private mapCurrentResponse(data: OWMCurrentResponse): DetailedCurrentWeather {
    const weather = data.weather?.[0];
    const now = data.dt;
    const isDaytime = now >= data.sys.sunrise && now < data.sys.sunset;

    return {
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      minTemp: data.main.temp_min,
      maxTemp: data.main.temp_max,
      humidity: data.main.humidity,
      seaLevelPressure: data.main.sea_level ?? data.main.pressure,
      groundLevelPressure: data.main.grnd_level ?? data.main.pressure,
      windSpeed: data.wind.speed * MS_TO_KMH,
      windGust: (data.wind.gust ?? 0) * MS_TO_KMH,
      windDirection: data.wind.deg,
      cloudCover: data.clouds.all,
      visibility: (data.visibility ?? 10_000) / M_TO_KM,
      rain1h: data.rain?.['1h'] ?? 0,
      snow1h: data.snow?.['1h'] ?? 0,
      precipitationProbability: 0,
      conditionId: weather?.id ?? 0,
      conditionName: weather?.main ?? '',
      conditionText: weather?.description ?? '',
      conditionIcon: weather
        ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
        : '',
      sunrise: new Date(data.sys.sunrise * 1_000).toISOString(),
      sunset: new Date(data.sys.sunset * 1_000).toISOString(),
      isDaytime,
      partOfDay: isDaytime ? 'd' : 'n',
      timezoneOffset: data.timezone,
    };
  }

  /** Convertit la reponse forecast de l'API OWM en objet de domaine. */
  private mapForecastResponse(
    data: OWMForecastResponse,
  ): DetailedForecastResult {
    const hourly: DetailedHourlyItem[] = data.list.map((item) => {
      const weather = item.weather?.[0];
      return {
        time: new Date(item.dt * 1_000).toISOString(),
        temperature: item.main.temp,
        feelsLike: item.main.feels_like,
        humidity: item.main.humidity,
        seaLevelPressure: item.main.sea_level ?? item.main.pressure,
        groundLevelPressure: item.main.grnd_level ?? item.main.pressure,
        windSpeed: item.wind.speed * MS_TO_KMH,
        windGust: (item.wind.gust ?? 0) * MS_TO_KMH,
        windDirection: item.wind.deg,
        cloudCover: item.clouds.all,
        visibility: (item.visibility ?? 10_000) / M_TO_KM,
        rain3h: item.rain?.['3h'] ?? 0,
        snow3h: item.snow?.['3h'] ?? 0,
        precipitationProbability: Math.round((item.pop ?? 0) * 100),
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
      timezoneOffset: data.city.timezone,
      hourly,
      daily,
    };
  }

  /** Agrege les donnees horaires en previsions journalieres. */
  private aggregateDaily(hourly: DetailedHourlyItem[]): DetailedDailyItem[] {
    const byDay = new Map<string, DetailedHourlyItem[]>();

    for (const item of hourly) {
      const date = item.time.slice(0, 10);
      const existing = byDay.get(date);
      if (existing) {
        existing.push(item);
      } else {
        byDay.set(date, [item]);
      }
    }

    const result: DetailedDailyItem[] = [];
    for (const [date, items] of byDay) {
      const temps = items.map((i) => i.temperature);
      // Choisir la condition dominante a midi (ou la premiere disponible)
      const midItem =
        items.find((i) => i.time.includes('T12:')) ??
        items.find((i) => i.time.includes('T15:')) ??
        items[0];

      result.push({
        date,
        minTemp: Math.min(...temps),
        maxTemp: Math.max(...temps),
        conditionId: midItem.conditionId,
        conditionName: midItem.conditionName,
        conditionText: midItem.conditionText,
        conditionIcon: midItem.conditionIcon,
      });
    }

    return result;
  }

  /** Effectue un appel HTTP GET avec timeout et gestion d'erreurs. */
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
      this.logger.warn(`Erreur OpenWeatherMap: ${String(error)}`);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

// --- Types internes pour les reponses brutes de l'API OWM ---

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
