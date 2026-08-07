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

const METRES_PER_KILOMETRE = 1_000;

/** Convertit des kilometres (port OWM) en metres (contrat Open-Meteo). */
function kilometresToMetres(kilometres: number): number {
  return kilometres * METRES_PER_KILOMETRE;
}

@Injectable()
export class ResilientWeatherProxyService implements IWeatherProxy {
  private readonly logger = new Logger(ResilientWeatherProxyService.name);
  private readonly openMeteoCb = new CircuitBreaker();
  private readonly owmCb = new CircuitBreaker();

  constructor(
    private readonly openMeteo: OpenMeteoProxyService,
    private readonly owm: OpenWeatherMapProxyService,
  ) {}

  async searchCity(
    name: string,
    language?: string,
    count?: number,
  ): Promise<GeocodingResult> {
    return this.executeWithoutFallback('searchCity', () =>
      this.openMeteo.searchCity(name, language, count),
    );
  }

  async getForecast(
    latitude: number,
    longitude: number,
    timezone?: string,
    forecastDays?: number,
  ): Promise<ForecastResult> {
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

  async getAirQuality(
    latitude: number,
    longitude: number,
  ): Promise<AirQualityResult> {
    return this.executeWithoutFallback('getAirQuality', () =>
      this.openMeteo.getAirQuality(latitude, longitude),
    );
  }

  async getEnsemble(
    latitude: number,
    longitude: number,
  ): Promise<EnsembleResult> {
    return this.executeWithoutFallback('getEnsemble', () =>
      this.openMeteo.getEnsemble(latitude, longitude),
    );
  }

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

  async getAlerts(
    latitude: number,
    longitude: number,
  ): Promise<WeatherAlertResult> {
    return this.executeWithoutFallback('getAlerts', () =>
      this.openMeteo.getAlerts(latitude, longitude),
    );
  }

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
        temperature_2m: current.temperatureCelsius,
        weather_code: this.owmConditionToWmo(current.conditionId),
        wind_speed_10m: current.windSpeedKmh,
        apparent_temperature: current.feelsLikeCelsius,
        relative_humidity_2m: current.humidityPercent,
        pressure_msl: current.seaLevelPressureHpa,
        uv_index: undefined,
        wind_direction_10m: current.windDirectionDegrees,
        wind_gusts_10m: current.windGustKmh,
        cloud_cover: current.cloudCoverPercent,
        visibility: kilometresToMetres(current.visibilityKm),
        dew_point_2m: undefined,
      },
      hourly: {
        time: forecast.hourly.map((h) => h.timeIso),
        temperature_2m: forecast.hourly.map((h) => h.temperatureCelsius),
        weather_code: forecast.hourly.map((h) =>
          this.owmConditionToWmo(h.conditionId),
        ),
        wind_speed_10m: forecast.hourly.map((h) => h.windSpeedKmh),
        precipitation: forecast.hourly.map(
          (h) => (h.rain3hMm ?? 0) + (h.snow3hMm ?? 0),
        ),
        relative_humidity_2m: forecast.hourly.map((h) => h.humidityPercent),
        pressure_msl: forecast.hourly.map((h) => h.seaLevelPressureHpa),
        wind_direction_10m: forecast.hourly.map((h) => h.windDirectionDegrees),
        wind_gusts_10m: forecast.hourly.map((h) => h.windGustKmh),
        cloud_cover: forecast.hourly.map((h) => h.cloudCoverPercent),
        visibility: forecast.hourly.map((h) =>
          kilometresToMetres(h.visibilityKm),
        ),
      },
      daily: {
        time: forecast.daily.map((d) => d.dateIso),
        weather_code: forecast.daily.map((d) =>
          this.owmConditionToWmo(d.conditionId),
        ),
        temperature_2m_max: forecast.daily.map((d) => d.maxTempCelsius),
        temperature_2m_min: forecast.daily.map((d) => d.minTempCelsius),
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
