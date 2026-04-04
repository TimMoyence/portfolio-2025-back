import { Injectable, Logger } from '@nestjs/common';
import type {
  AirQualityResult,
  EnsembleResult,
  ForecastResult,
  GeocodingResult,
  HistoricalResult,
  IWeatherProxy,
} from '../domain/IWeatherProxy.port';
import type { WeatherAlertResult } from '../domain/WeatherAlert';
import { WeatherAlertAnalyzer } from '../domain/WeatherAlertAnalyzer';
import { WeatherCache } from './weather-cache';

/** Delai d'attente maximal pour les appels Open-Meteo (ms). */
const FETCH_TIMEOUT_MS = 8_000;

/** URL de base de l'API de geocodage Open-Meteo. */
const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search';

/** URL de base de l'API de previsions Open-Meteo. */
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';

/** URL de base de l'API de qualite de l'air Open-Meteo. */
const AIR_QUALITY_BASE =
  'https://air-quality-api.open-meteo.com/v1/air-quality';

/** URL des modeles d'ensemble Open-Meteo. */
const ECMWF_BASE = 'https://api.open-meteo.com/v1/ecmwf';
const GFS_BASE = 'https://api.open-meteo.com/v1/gfs';
const ICON_BASE = 'https://api.open-meteo.com/v1/dwd-icon';

/** URL de base de l'API d'archives Open-Meteo. */
const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive';

/** Implementation du proxy meteo utilisant l'API Open-Meteo. */
@Injectable()
export class OpenMeteoProxyService implements IWeatherProxy {
  private readonly logger = new Logger(OpenMeteoProxyService.name);
  private readonly cache = new WeatherCache();
  private readonly alertAnalyzer = new WeatherAlertAnalyzer();

  /** Recherche de villes par nom via le geocodage Open-Meteo. */
  async searchCity(
    name: string,
    language = 'fr',
    count = 5,
  ): Promise<GeocodingResult> {
    const cacheKey = `geo:${name}:${language}:${count}`;
    const cached = this.cache.get<GeocodingResult>(cacheKey);
    if (cached) return cached;

    const url = `${GEOCODING_BASE}?name=${encodeURIComponent(name)}&count=${count}&language=${encodeURIComponent(language)}`;
    const data = await this.fetchJson<GeocodingResult>(url);
    const result: GeocodingResult = { results: data.results ?? [] };
    this.cache.setWithStrategy(cacheKey, result, 'geocoding');
    return result;
  }

  /** Recupere les previsions meteo pour des coordonnees donnees. */
  async getForecast(
    latitude: number,
    longitude: number,
    timezone = 'auto',
    forecastDays = 7,
  ): Promise<ForecastResult> {
    const cacheKey = `forecast:${latitude}:${longitude}:${timezone}:${forecastDays}`;
    const cached = this.cache.get<ForecastResult>(cacheKey);
    if (cached) return cached;

    const url =
      `${FORECAST_BASE}?latitude=${latitude}&longitude=${longitude}` +
      `&hourly=temperature_2m,weather_code,wind_speed_10m,precipitation,relative_humidity_2m,dew_point_2m,pressure_msl,uv_index,wind_direction_10m,wind_gusts_10m,cloud_cover,visibility` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant` +
      `&current=temperature_2m,weather_code,wind_speed_10m,apparent_temperature,relative_humidity_2m,pressure_msl,uv_index,wind_direction_10m,wind_gusts_10m,cloud_cover,visibility,dew_point_2m` +
      `&timezone=${encodeURIComponent(timezone)}&forecast_days=${forecastDays}`;

    const data = await this.fetchJson<ForecastResult>(url);
    this.cache.setWithStrategy(
      cacheKey,
      data,
      'forecast',
      data.current?.weather_code,
    );
    return data;
  }

  /** Recupere les donnees de qualite de l'air pour des coordonnees donnees. */
  async getAirQuality(
    latitude: number,
    longitude: number,
  ): Promise<AirQualityResult> {
    const cacheKey = `air-quality:${latitude}:${longitude}`;
    const cached = this.cache.get<AirQualityResult>(cacheKey);
    if (cached) return cached;

    const url =
      `${AIR_QUALITY_BASE}?latitude=${latitude}&longitude=${longitude}` +
      `&current=european_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide` +
      `&hourly=european_aqi,pm2_5,pm10,ozone&forecast_days=1`;

    const data = await this.fetchJson<AirQualityResult>(url);
    this.cache.setWithStrategy(cacheKey, data, 'air-quality');
    return data;
  }

  /** Recupere les previsions multi-modeles (ECMWF, GFS, ICON) en parallele. */
  async getEnsemble(
    latitude: number,
    longitude: number,
  ): Promise<EnsembleResult> {
    const cacheKey = `ensemble:${latitude}:${longitude}`;
    const cached = this.cache.get<EnsembleResult>(cacheKey);
    if (cached) return cached;

    const hourlyBase = 'temperature_2m,precipitation,wind_speed_10m';
    const urls: { model: string; url: string; hasCape: boolean }[] = [
      {
        model: 'ecmwf',
        url: `${ECMWF_BASE}?latitude=${latitude}&longitude=${longitude}&hourly=${hourlyBase}&forecast_days=7`,
        hasCape: false,
      },
      {
        model: 'gfs',
        url: `${GFS_BASE}?latitude=${latitude}&longitude=${longitude}&hourly=${hourlyBase},cape&forecast_days=7`,
        hasCape: true,
      },
      {
        model: 'icon',
        url: `${ICON_BASE}?latitude=${latitude}&longitude=${longitude}&hourly=${hourlyBase}&forecast_days=7`,
        hasCape: false,
      },
    ];

    const settled = await Promise.allSettled(
      urls.map(async ({ model, url, hasCape }) => {
        const data = await this.fetchJson<{
          hourly: {
            time: string[];
            temperature_2m: number[];
            precipitation: number[];
            wind_speed_10m: number[];
            cape?: number[];
          };
        }>(url);

        return {
          model,
          hourly: {
            time: data.hourly.time,
            temperature_2m: data.hourly.temperature_2m,
            precipitation: data.hourly.precipitation,
            wind_speed_10m: data.hourly.wind_speed_10m,
            ...(hasCape && data.hourly.cape ? { cape: data.hourly.cape } : {}),
          },
        };
      }),
    );

    const models = settled
      .filter(
        (r): r is PromiseFulfilledResult<EnsembleResult['models'][number]> =>
          r.status === 'fulfilled',
      )
      .map((r) => r.value);

    for (const r of settled) {
      if (r.status === 'rejected') {
        this.logger.warn(`Echec d'un modele d'ensemble: ${String(r.reason)}`);
      }
    }

    const result: EnsembleResult = { models };
    this.cache.setWithStrategy(cacheKey, result, 'ensemble');
    return result;
  }

  /** Recupere les donnees meteo historiques depuis l'API d'archives Open-Meteo. */
  async getHistorical(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
  ): Promise<HistoricalResult> {
    const cacheKey = `historical:${latitude}:${longitude}:${startDate}:${endDate}`;
    const cached = this.cache.get<HistoricalResult>(cacheKey);
    if (cached) return cached;

    const url =
      `${ARCHIVE_BASE}?latitude=${latitude}&longitude=${longitude}` +
      `&start_date=${startDate}&end_date=${endDate}` +
      `&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum` +
      `&timezone=auto`;

    const data = await this.fetchJson<HistoricalResult>(url);
    this.cache.setWithStrategy(cacheKey, data, 'historical');
    return data;
  }

  /** Recupere les alertes meteo synthetiques basees sur les previsions 24h. */
  async getAlerts(
    latitude: number,
    longitude: number,
  ): Promise<WeatherAlertResult> {
    const cacheKey = `alerts:${latitude}:${longitude}`;
    const cached = this.cache.get<WeatherAlertResult>(cacheKey);
    if (cached) return cached;

    // Utilise les previsions existantes (deja cachees) pour analyser les 24 prochaines heures
    const forecast = await this.getForecast(latitude, longitude, 'auto', 2);
    const alerts = this.alertAnalyzer.analyze(forecast);
    const result: WeatherAlertResult = { alerts };
    this.cache.setWithStrategy(cacheKey, result, 'alerts');
    return result;
  }

  /** Effectue un appel HTTP GET avec timeout et gestion d'erreurs. */
  private async fetchJson<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        const safeUrl = new URL(url).pathname;
        this.logger.warn(`Timeout apres ${FETCH_TIMEOUT_MS}ms pour ${safeUrl}`);
        throw new Error(`Open-Meteo timeout (${FETCH_TIMEOUT_MS}ms)`);
      }
      this.logger.warn(`Erreur Open-Meteo: ${String(error)}`);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
