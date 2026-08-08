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
import type {
  DetailedCurrentWeather,
  DetailedForecastResult,
} from '../domain/IOpenWeatherMapProxy.port';
import { OpenMeteoProxyService } from './OpenMeteoProxy.service';
import { OpenWeatherMapProxyService } from './OpenWeatherMapProxy.service';

const METRES_PER_KILOMETRE = 1_000;

const OWM_GROUP_THUNDERSTORM = 2;
const OWM_GROUP_DRIZZLE = 3;
const OWM_GROUP_RAIN = 5;
const OWM_GROUP_SNOW = 6;
const OWM_GROUP_ATMOSPHERE = 7;
const OWM_GROUP_CLEAR_OR_CLOUDS = 8;
const OWM_CONDITION_GROUP_SIZE = 100;
const OWM_FREEZING_RAIN_ID = 511;
const OWM_CLEAR_SKY_ID = 800;
const OWM_SCATTERED_CLOUDS_MAX_ID = 802;

const WMO_CLEAR_SKY = 0;
const WMO_PARTLY_CLOUDY = 2;
const WMO_OVERCAST = 3;
const WMO_FOG = 45;
const WMO_DRIZZLE = 51;
const WMO_RAIN = 61;
const WMO_FREEZING_RAIN = 66;
const WMO_SNOW = 71;
const WMO_THUNDERSTORM = 95;

function kilometresToMetres(kilometres: number): number {
  return kilometres * METRES_PER_KILOMETRE;
}

function cloudCoverToWmo(conditionId: number): number {
  if (conditionId === OWM_CLEAR_SKY_ID) return WMO_CLEAR_SKY;
  return conditionId <= OWM_SCATTERED_CLOUDS_MAX_ID
    ? WMO_PARTLY_CLOUDY
    : WMO_OVERCAST;
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

  private mapOwmToForecast(
    current: DetailedCurrentWeather,
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
    const group = Math.floor(conditionId / OWM_CONDITION_GROUP_SIZE);
    switch (group) {
      case OWM_GROUP_THUNDERSTORM:
        return WMO_THUNDERSTORM;
      case OWM_GROUP_DRIZZLE:
        return WMO_DRIZZLE;
      case OWM_GROUP_RAIN:
        return conditionId === OWM_FREEZING_RAIN_ID
          ? WMO_FREEZING_RAIN
          : WMO_RAIN;
      case OWM_GROUP_SNOW:
        return WMO_SNOW;
      case OWM_GROUP_ATMOSPHERE:
        return WMO_FOG;
      case OWM_GROUP_CLEAR_OR_CLOUDS:
        return cloudCoverToWmo(conditionId);
      default:
        return WMO_CLEAR_SKY;
    }
  }
}
