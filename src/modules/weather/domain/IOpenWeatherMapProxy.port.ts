export interface DetailedCurrentWeather {
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  minTempCelsius: number;
  maxTempCelsius: number;
  humidityPercent: number;
  seaLevelPressureHpa: number;
  groundLevelPressureHpa: number;
  windSpeedKmh: number;
  windGustKmh: number;
  windDirectionDegrees: number;
  cloudCoverPercent: number;
  visibilityKm: number;
  rain1hMm: number;
  snow1hMm: number;
  precipitationProbabilityPercent: number;
  conditionId: number;
  conditionName: string;
  conditionText: string;
  conditionIcon: string;
  sunriseIso: string;
  sunsetIso: string;
  isDaytime: boolean;
  /** 'd' pour jour, 'n' pour nuit. */
  partOfDay: 'd' | 'n';
  timezoneOffsetSeconds: number;
}

export interface DetailedHourlyItem {
  timeIso: string;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  humidityPercent: number;
  seaLevelPressureHpa: number;
  groundLevelPressureHpa: number;
  windSpeedKmh: number;
  windGustKmh: number;
  windDirectionDegrees: number;
  cloudCoverPercent: number;
  visibilityKm: number;
  rain3hMm: number;
  snow3hMm: number;
  precipitationProbabilityPercent: number;
  conditionId: number;
  conditionName: string;
  conditionText: string;
  conditionIcon: string;
  /** 'd' pour jour, 'n' pour nuit. */
  partOfDay: 'd' | 'n';
}

export interface DetailedDailyItem {
  dateIso: string;
  minTempCelsius: number;
  maxTempCelsius: number;
  conditionId: number;
  conditionName: string;
  conditionText: string;
  conditionIcon: string;
}

export interface DetailedForecastResult {
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  timezoneOffsetSeconds: number;
  hourly: DetailedHourlyItem[];
  daily: DetailedDailyItem[];
}

export interface IOpenWeatherMapProxy {
  getCurrentDetailed(
    latitude: number,
    longitude: number,
  ): Promise<DetailedCurrentWeather>;

  getForecastDetailed(
    latitude: number,
    longitude: number,
  ): Promise<DetailedForecastResult>;
}
