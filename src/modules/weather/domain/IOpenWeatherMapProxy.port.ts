/**
 * Donnees meteo detaillees courantes provenant d'OpenWeatherMap.
 * Modelise a partir du WeatherSnapshot C# d'origine.
 */
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
  /** Identifiant de la condition meteo OWM. */
  conditionId: number;
  /** Nom court de la condition meteo (ex: « Rain »). */
  conditionName: string;
  /** Description textuelle de la condition meteo. */
  conditionText: string;
  /** URL de l'icone de la condition meteo. */
  conditionIcon: string;
  /** Heure du lever de soleil (ISO 8601). */
  sunrise: string;
  /** Heure du coucher de soleil (ISO 8601). */
  sunset: string;
  /** Indique s'il fait jour. */
  isDaytime: boolean;
  /** Partie de la journee ('d' pour jour, 'n' pour nuit). */
  partOfDay: 'd' | 'n';
  /** Decalage horaire en secondes. */
  timezoneOffset: number;
}

/** Element horaire d'une prevision detaillee. */
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
  /** Identifiant de la condition meteo. */
  conditionId: number;
  /** Nom court de la condition meteo. */
  conditionName: string;
  /** Description textuelle de la condition. */
  conditionText: string;
  /** URL de l'icone de la condition. */
  conditionIcon: string;
  /** Partie de la journee ('d' ou 'n'). */
  partOfDay: 'd' | 'n';
}

/** Agregation journaliere d'une prevision detaillee. */
export interface DetailedDailyItem {
  /** Date (YYYY-MM-DD). */
  date: string;
  /** Temperature minimale (degres Celsius). */
  minTemp: number;
  /** Temperature maximale (degres Celsius). */
  maxTemp: number;
  /** Code meteo dominant de la journee. */
  conditionId: number;
  /** Nom de la condition dominante. */
  conditionName: string;
  /** Description de la condition dominante. */
  conditionText: string;
  /** URL de l'icone de la condition dominante. */
  conditionIcon: string;
}

/** Resultat complet des previsions detaillees. */
export interface DetailedForecastResult {
  /** Nom de la ville. */
  cityName: string;
  /** Code pays. */
  country: string;
  /** Latitude. */
  latitude: number;
  /** Longitude. */
  longitude: number;
  /** Decalage horaire en secondes. */
  timezoneOffset: number;
  /** Previsions horaires. */
  hourly: DetailedHourlyItem[];
  /** Agregation journaliere. */
  daily: DetailedDailyItem[];
}

/** Port pour le proxy OpenWeatherMap (donnees detaillees). */
export interface IOpenWeatherMapProxy {
  /** Recupere les donnees meteo detaillees courantes. */
  getCurrentDetailed(
    latitude: number,
    longitude: number,
  ): Promise<DetailedCurrentWeather>;

  /** Recupere les previsions detaillees. */
  getForecastDetailed(
    latitude: number,
    longitude: number,
  ): Promise<DetailedForecastResult>;
}
