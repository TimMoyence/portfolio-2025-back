import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreaker } from '../domain/CircuitBreaker';
import type {
  AirQualityResult,
  EnsembleResult,
  ForecastResult,
  GeocodingResult,
  HistoricalResult,
  IWeatherProxy,
  WeatherAlertResult,
} from '../domain/IWeatherProxy.port';
import type { DetailedForecastResult } from '../domain/IOpenWeatherMapProxy.port';
import { OpenMeteoProxyService } from './OpenMeteoProxy.service';
import { OpenWeatherMapProxyService } from './OpenWeatherMapProxy.service';

/**
 * Proxy resilient pour les appels meteo.
 *
 * Wraps les appels vers Open-Meteo avec un circuit breaker et
 * fournit un fallback vers OpenWeatherMap lorsque c'est possible.
 * Le fallback OWM n'est disponible que pour `getForecast` ;
 * les autres methodes (searchCity, getAirQuality, getEnsemble,
 * getHistorical) n'ont pas d'equivalent OWM et relancent l'erreur.
 */
@Injectable()
export class ResilientWeatherProxyService implements IWeatherProxy {
  private readonly logger = new Logger(ResilientWeatherProxyService.name);
  private readonly openMeteoCb = new CircuitBreaker();
  private readonly owmCb = new CircuitBreaker();

  constructor(
    private readonly openMeteo: OpenMeteoProxyService,
    private readonly owm: OpenWeatherMapProxyService,
  ) {}

  /** Recherche de villes — uniquement via Open-Meteo, pas de fallback OWM. */
  async searchCity(
    name: string,
    language?: string,
    count?: number,
  ): Promise<GeocodingResult> {
    return this.executeWithoutFallback('searchCity', () =>
      this.openMeteo.searchCity(name, language, count),
    );
  }

  /**
   * Recupere les previsions meteo.
   * Fallback vers OWM : mappe DetailedForecastResult + DetailedCurrentWeather
   * vers un ForecastResult approximatif.
   */
  async getForecast(
    latitude: number,
    longitude: number,
    timezone?: string,
    forecastDays?: number,
  ): Promise<ForecastResult> {
    // Tenter Open-Meteo si le circuit le permet
    if (this.openMeteoCb.canExecute()) {
      try {
        const result = await this.openMeteo.getForecast(
          latitude,
          longitude,
          timezone,
          forecastDays,
        );
        this.openMeteoCb.recordSuccess();
        return result;
      } catch (error) {
        this.openMeteoCb.recordFailure();
        this.logger.warn(
          `Open-Meteo getForecast en echec, tentative de fallback OWM: ${String(error)}`,
        );
      }
    }

    // Fallback OWM
    if (this.owmCb.canExecute()) {
      try {
        const [current, forecast] = await Promise.all([
          this.owm.getCurrentDetailed(latitude, longitude),
          this.owm.getForecastDetailed(latitude, longitude),
        ]);
        this.owmCb.recordSuccess();
        return this.mapOwmToForecast(current, forecast);
      } catch (owmError) {
        this.owmCb.recordFailure();
        this.logger.error(
          `OWM getForecast egalement en echec: ${String(owmError)}`,
        );
        throw owmError;
      }
    }

    throw new Error(
      'Tous les circuits sont ouverts — impossible de recuperer les previsions',
    );
  }

  /** Qualite de l'air — uniquement via Open-Meteo, pas de fallback OWM. */
  async getAirQuality(
    latitude: number,
    longitude: number,
  ): Promise<AirQualityResult> {
    return this.executeWithoutFallback('getAirQuality', () =>
      this.openMeteo.getAirQuality(latitude, longitude),
    );
  }

  /** Previsions multi-modeles — uniquement via Open-Meteo, pas de fallback OWM. */
  async getEnsemble(
    latitude: number,
    longitude: number,
  ): Promise<EnsembleResult> {
    return this.executeWithoutFallback('getEnsemble', () =>
      this.openMeteo.getEnsemble(latitude, longitude),
    );
  }

  /** Donnees historiques — uniquement via Open-Meteo, pas de fallback OWM. */
  async getHistorical(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
  ): Promise<HistoricalResult> {
    return this.executeWithoutFallback('getHistorical', () =>
      this.openMeteo.getHistorical(latitude, longitude, startDate, endDate),
    );
  }

  /** Alertes meteo synthetiques — uniquement via Open-Meteo, pas de fallback OWM. */
  async getAlerts(
    latitude: number,
    longitude: number,
  ): Promise<WeatherAlertResult> {
    return this.executeWithoutFallback('getAlerts', () =>
      this.openMeteo.getAlerts(latitude, longitude),
    );
  }

  /**
   * Execute une operation via Open-Meteo avec gestion du circuit breaker.
   * Aucun fallback disponible : relance l'erreur en cas d'echec.
   */
  private async executeWithoutFallback<T>(
    operationName: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    if (!this.openMeteoCb.canExecute()) {
      throw new Error(
        `Circuit Open-Meteo ouvert — ${operationName} indisponible`,
      );
    }

    try {
      const result = await operation();
      this.openMeteoCb.recordSuccess();
      return result;
    } catch (error) {
      this.openMeteoCb.recordFailure();
      this.logger.warn(
        `Open-Meteo ${operationName} en echec: ${String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Convertit les donnees detaillees OWM en ForecastResult approximatif.
   *
   * Le mapping est approximatif car les structures OWM et Open-Meteo
   * different significativement (OWM utilise des conditionId, Open-Meteo
   * des weather_code WMO ; OWM donne des previsions 3h, Open-Meteo horaires).
   */
  private mapOwmToForecast(
    current: import('../domain/IOpenWeatherMapProxy.port').DetailedCurrentWeather,
    forecast: DetailedForecastResult,
  ): ForecastResult {
    return {
      current: {
        temperature_2m: current.temperature,
        weather_code: this.owmConditionToWmo(current.conditionId),
        wind_speed_10m: current.windSpeed,
        apparent_temperature: current.feelsLike,
        relative_humidity_2m: current.humidity,
        pressure_msl: current.seaLevelPressure,
        uv_index: undefined,
        wind_direction_10m: current.windDirection,
        wind_gusts_10m: current.windGust,
        cloud_cover: current.cloudCover,
        visibility: current.visibility * 1_000,
        dew_point_2m: undefined,
      },
      hourly: {
        time: forecast.hourly.map((h) => h.time),
        temperature_2m: forecast.hourly.map((h) => h.temperature),
        weather_code: forecast.hourly.map((h) =>
          this.owmConditionToWmo(h.conditionId),
        ),
        wind_speed_10m: forecast.hourly.map((h) => h.windSpeed),
        precipitation: forecast.hourly.map(
          (h) => (h.rain3h ?? 0) + (h.snow3h ?? 0),
        ),
        relative_humidity_2m: forecast.hourly.map((h) => h.humidity),
        pressure_msl: forecast.hourly.map((h) => h.seaLevelPressure),
        wind_direction_10m: forecast.hourly.map((h) => h.windDirection),
        wind_gusts_10m: forecast.hourly.map((h) => h.windGust),
        cloud_cover: forecast.hourly.map((h) => h.cloudCover),
        visibility: forecast.hourly.map((h) => h.visibility * 1_000),
      },
      daily: {
        time: forecast.daily.map((d) => d.date),
        weather_code: forecast.daily.map((d) =>
          this.owmConditionToWmo(d.conditionId),
        ),
        temperature_2m_max: forecast.daily.map((d) => d.maxTemp),
        temperature_2m_min: forecast.daily.map((d) => d.minTemp),
        sunrise: [],
        sunset: [],
        precipitation_sum: [],
      },
    };
  }

  /**
   * Mapping approximatif d'un conditionId OWM vers un weather_code WMO.
   *
   * Les codes OWM (https://openweathermap.org/weather-conditions)
   * et WMO (https://open-meteo.com/en/docs) ne sont pas equivalents ;
   * ce mapping couvre les cas principaux.
   */
  private owmConditionToWmo(conditionId: number): number {
    const group = Math.floor(conditionId / 100);
    switch (group) {
      case 2:
        return 95; // Orage
      case 3:
        return 51; // Bruine
      case 5:
        return conditionId === 511 ? 66 : 61; // Pluie / pluie verglacante
      case 6:
        return 71; // Neige
      case 7:
        return 45; // Brouillard / brume
      case 8:
        return conditionId === 800 ? 0 : conditionId <= 802 ? 2 : 3; // Clair / nuageux
      default:
        return 0;
    }
  }
}
