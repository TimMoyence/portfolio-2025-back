import type { WeatherAlertResult } from './WeatherAlert';
export type { WeatherAlertResult } from './WeatherAlert';

interface GeocodingCity {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
}

export interface GeocodingResult {
  results: GeocodingCity[];
}

interface CurrentWeather {
  temperature_2m: number;
  weather_code: number;
  wind_speed_10m: number;
  apparent_temperature: number;
  relative_humidity_2m?: number;
  pressure_msl?: number;
  uv_index?: number;
  wind_direction_10m?: number;
  wind_gusts_10m?: number;
  cloud_cover?: number;
  visibility?: number;
  dew_point_2m?: number;
}

interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  precipitation: number[];
  relative_humidity_2m?: number[];
  dew_point_2m?: number[];
  pressure_msl?: number[];
  uv_index?: number[];
  wind_direction_10m?: number[];
  wind_gusts_10m?: number[];
  cloud_cover?: number[];
  visibility?: number[];
}

interface DailyWeather {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  precipitation_sum: number[];
  uv_index_max?: number[];
  wind_speed_10m_max?: number[];
  wind_gusts_10m_max?: number[];
  wind_direction_10m_dominant?: number[];
}

export interface ForecastResult {
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

interface AirQualityCurrent {
  european_aqi: number;
  pm2_5: number;
  pm10: number;
  ozone: number;
  nitrogen_dioxide: number;
  sulphur_dioxide: number;
}

interface AirQualityHourly {
  time: string[];
  european_aqi: number[];
  pm2_5: number[];
  pm10: number[];
  ozone: number[];
}

export interface AirQualityResult {
  current: AirQualityCurrent;
  hourly: AirQualityHourly;
}

interface EnsembleModelHourly {
  time: string[];
  temperature_2m: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  cape?: number[];
}

interface EnsembleModel {
  model: string;
  hourly: EnsembleModelHourly;
}

export interface EnsembleResult {
  models: EnsembleModel[];
}

export interface HistoricalResult {
  daily: {
    time: string[];
    temperature_2m_mean: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

export interface IWeatherProxy {
  searchCity(
    name: string,
    language?: string,
    count?: number,
  ): Promise<GeocodingResult>;
  getForecast(
    latitude: number,
    longitude: number,
    timezone?: string,
    forecastDays?: number,
  ): Promise<ForecastResult>;
  getAirQuality(latitude: number, longitude: number): Promise<AirQualityResult>;

  getEnsemble(latitude: number, longitude: number): Promise<EnsembleResult>;

  getHistorical(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
  ): Promise<HistoricalResult>;

  getAlerts(latitude: number, longitude: number): Promise<WeatherAlertResult>;
}
