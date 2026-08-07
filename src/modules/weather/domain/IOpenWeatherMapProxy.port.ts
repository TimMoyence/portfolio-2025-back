export interface DetailedCurrentWeather {
  /** Temperature en degres Celsius. */
  temperature: number;
  /** Temperature ressentie en degres Celsius. */
  feelsLike: number;
  /** Temperature minimale en degres Celsius. */
  minTemp: number;
  /** Temperature maximale en degres Celsius. */
  maxTemp: number;
  /** Humidite relative (%). */
  humidity: number;
  /** Pression au niveau de la mer (hPa). */
  seaLevelPressure: number;
  /** Pression au niveau du sol (hPa). */
  groundLevelPressure: number;
  /** Vitesse du vent (km/h). */
  windSpeed: number;
  /** Rafales de vent (km/h). */
  windGust: number;
  /** Direction du vent (degres). */
  windDirection: number;
  /** Couverture nuageuse (%). */
  cloudCover: number;
  /** Visibilite (km). */
  visibility: number;
  /** Pluie sur la derniere heure (mm). */
  rain1h: number;
  /** Neige sur la derniere heure (mm). */
  snow1h: number;
  /** Probabilite de precipitation (%). */
  precipitationProbability: number;
  conditionId: number;
  conditionName: string;
  conditionText: string;
  conditionIcon: string;
  /** Heure du lever de soleil (ISO 8601). */
  sunrise: string;
  /** Heure du coucher de soleil (ISO 8601). */
  sunset: string;
  isDaytime: boolean;
  /** Partie de la journee ('d' pour jour, 'n' pour nuit). */
  partOfDay: 'd' | 'n';
  /** Decalage horaire en secondes. */
  timezoneOffset: number;
}

export interface DetailedHourlyItem {
  /** Horodatage ISO 8601. */
  time: string;
  /** Temperature en degres Celsius. */
  temperature: number;
  /** Temperature ressentie en degres Celsius. */
  feelsLike: number;
  /** Humidite relative (%). */
  humidity: number;
  /** Pression au niveau de la mer (hPa). */
  seaLevelPressure: number;
  /** Pression au niveau du sol (hPa). */
  groundLevelPressure: number;
  /** Vitesse du vent (km/h). */
  windSpeed: number;
  /** Rafales de vent (km/h). */
  windGust: number;
  /** Direction du vent (degres). */
  windDirection: number;
  /** Couverture nuageuse (%). */
  cloudCover: number;
  /** Visibilite (km). */
  visibility: number;
  /** Pluie sur 3 heures (mm). */
  rain3h: number;
  /** Neige sur 3 heures (mm). */
  snow3h: number;
  /** Probabilite de precipitation (%). */
  precipitationProbability: number;
  conditionId: number;
  conditionName: string;
  conditionText: string;
  conditionIcon: string;
  /** Partie de la journee ('d' ou 'n'). */
  partOfDay: 'd' | 'n';
}

export interface DetailedDailyItem {
  /** Date (YYYY-MM-DD). */
  date: string;
  /** Temperature minimale (degres Celsius). */
  minTemp: number;
  /** Temperature maximale (degres Celsius). */
  maxTemp: number;
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
  /** Decalage horaire en secondes. */
  timezoneOffset: number;
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
