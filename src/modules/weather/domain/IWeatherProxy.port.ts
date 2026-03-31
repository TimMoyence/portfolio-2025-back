/** Ville retournee par l'API de geocodage. */
export interface GeocodingCity {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
}

/** Resultat du geocodage (recherche de ville). */
export interface GeocodingResult {
  results: GeocodingCity[];
}

/** Donnees meteo courantes. */
export interface CurrentWeather {
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

/** Donnees meteo horaires. */
export interface HourlyWeather {
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

/** Donnees meteo journalieres. */
export interface DailyWeather {
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

/** Resultat complet des previsions meteo. */
export interface ForecastResult {
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

/** Donnees courantes de qualite de l'air. */
export interface AirQualityCurrent {
  european_aqi: number;
  pm2_5: number;
  pm10: number;
  ozone: number;
  nitrogen_dioxide: number;
  sulphur_dioxide: number;
}

/** Donnees horaires de qualite de l'air. */
export interface AirQualityHourly {
  time: string[];
  european_aqi: number[];
  pm2_5: number[];
  pm10: number[];
  ozone: number[];
}

/** Resultat complet de la qualite de l'air. */
export interface AirQualityResult {
  current: AirQualityCurrent;
  hourly: AirQualityHourly;
}

/** Donnees horaires d'un modele d'ensemble. */
export interface EnsembleModelHourly {
  time: string[];
  temperature_2m: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  cape?: number[];
}

/** Modele individuel dans le resultat d'ensemble. */
export interface EnsembleModel {
  model: string;
  hourly: EnsembleModelHourly;
}

/** Resultat des previsions multi-modeles (ensemble). */
export interface EnsembleResult {
  models: EnsembleModel[];
}

/** Resultat des donnees meteo historiques. */
export interface HistoricalResult {
  daily: {
    time: string[];
    temperature_2m_mean: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

/** Port pour le proxy d'API meteo externe. */
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
  ): Promise<ForecastResult>;
  getAirQuality(latitude: number, longitude: number): Promise<AirQualityResult>;

  /** Recupere les previsions multi-modeles (ECMWF, GFS, ICON). */
  getEnsemble(latitude: number, longitude: number): Promise<EnsembleResult>;

  /** Recupere les donnees meteo historiques pour une periode donnee. */
  getHistorical(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
  ): Promise<HistoricalResult>;
}
