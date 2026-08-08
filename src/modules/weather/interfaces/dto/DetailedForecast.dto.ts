import { ApiProperty } from '@nestjs/swagger';
import type {
  DetailedDailyItem,
  DetailedForecastResult,
  DetailedHourlyItem,
} from '../../domain/IOpenWeatherMapProxy.port';

/** Cles publiees verrouillees par weather-wire-contract.spec.ts. */
export class DetailedHourlyItemDto {
  @ApiProperty({ description: 'Horodatage (ISO 8601)' })
  time: string;

  @ApiProperty({ description: 'Temperature (°C)' })
  temperature: number;

  @ApiProperty({ description: 'Temperature ressentie (°C)' })
  feelsLike: number;

  @ApiProperty({ description: 'Humidite relative (%)' })
  humidity: number;

  @ApiProperty({ description: 'Pression au niveau de la mer (hPa)' })
  seaLevelPressure: number;

  @ApiProperty({ description: 'Pression au niveau du sol (hPa)' })
  groundLevelPressure: number;

  @ApiProperty({ description: 'Vitesse du vent (km/h)' })
  windSpeed: number;

  @ApiProperty({ description: 'Rafales (km/h)' })
  windGust: number;

  @ApiProperty({ description: 'Direction du vent (degres)' })
  windDirection: number;

  @ApiProperty({ description: 'Couverture nuageuse (%)' })
  cloudCover: number;

  @ApiProperty({ description: 'Visibilite (km)' })
  visibility: number;

  @ApiProperty({ description: 'Pluie sur 3 heures (mm)' })
  rain3h: number;

  @ApiProperty({ description: 'Neige sur 3 heures (mm)' })
  snow3h: number;

  @ApiProperty({ description: 'Probabilite de precipitation (%)' })
  precipitationProbability: number;

  @ApiProperty({ description: 'Identifiant condition meteo' })
  conditionId: number;

  @ApiProperty({ description: 'Nom condition meteo' })
  conditionName: string;

  @ApiProperty({ description: 'Description condition meteo' })
  conditionText: string;

  @ApiProperty({ description: 'URL icone condition' })
  conditionIcon: string;

  @ApiProperty({ description: 'Partie de la journee', enum: ['d', 'n'] })
  partOfDay: 'd' | 'n';

  static fromDomain(data: DetailedHourlyItem): DetailedHourlyItemDto {
    const dto = new DetailedHourlyItemDto();
    dto.time = data.timeIso;
    dto.temperature = data.temperatureCelsius;
    dto.feelsLike = data.feelsLikeCelsius;
    dto.humidity = data.humidityPercent;
    dto.seaLevelPressure = data.seaLevelPressureHpa;
    dto.groundLevelPressure = data.groundLevelPressureHpa;
    dto.windSpeed = data.windSpeedKmh;
    dto.windGust = data.windGustKmh;
    dto.windDirection = data.windDirectionDegrees;
    dto.cloudCover = data.cloudCoverPercent;
    dto.visibility = data.visibilityKm;
    dto.rain3h = data.rain3hMm;
    dto.snow3h = data.snow3hMm;
    dto.precipitationProbability = data.precipitationProbabilityPercent;
    dto.conditionId = data.conditionId;
    dto.conditionName = data.conditionName;
    dto.conditionText = data.conditionText;
    dto.conditionIcon = data.conditionIcon;
    dto.partOfDay = data.partOfDay;
    return dto;
  }
}

/** Cles publiees verrouillees par weather-wire-contract.spec.ts. */
export class DetailedDailyItemDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Temperature minimale (°C)' })
  minTemp: number;

  @ApiProperty({ description: 'Temperature maximale (°C)' })
  maxTemp: number;

  @ApiProperty({ description: 'Identifiant condition meteo' })
  conditionId: number;

  @ApiProperty({ description: 'Nom condition meteo' })
  conditionName: string;

  @ApiProperty({ description: 'Description condition meteo' })
  conditionText: string;

  @ApiProperty({ description: 'URL icone condition' })
  conditionIcon: string;

  static fromDomain(data: DetailedDailyItem): DetailedDailyItemDto {
    const dto = new DetailedDailyItemDto();
    dto.date = data.dateIso;
    dto.minTemp = data.minTempCelsius;
    dto.maxTemp = data.maxTempCelsius;
    dto.conditionId = data.conditionId;
    dto.conditionName = data.conditionName;
    dto.conditionText = data.conditionText;
    dto.conditionIcon = data.conditionIcon;
    return dto;
  }
}

/** Cles publiees verrouillees par weather-wire-contract.spec.ts. */
export class DetailedForecastDto {
  @ApiProperty({ description: 'Nom de la ville' })
  cityName: string;

  @ApiProperty({ description: 'Code pays' })
  country: string;

  @ApiProperty({ description: 'Latitude' })
  latitude: number;

  @ApiProperty({ description: 'Longitude' })
  longitude: number;

  @ApiProperty({ description: 'Decalage horaire (secondes)' })
  timezoneOffset: number;

  @ApiProperty({
    description: 'Previsions horaires',
    type: [DetailedHourlyItemDto],
  })
  hourly: DetailedHourlyItemDto[];

  @ApiProperty({
    description: 'Agregation journaliere',
    type: [DetailedDailyItemDto],
  })
  daily: DetailedDailyItemDto[];

  static fromDomain(data: DetailedForecastResult): DetailedForecastDto {
    const dto = new DetailedForecastDto();
    dto.cityName = data.cityName;
    dto.country = data.country;
    dto.latitude = data.latitude;
    dto.longitude = data.longitude;
    dto.timezoneOffset = data.timezoneOffsetSeconds;
    dto.hourly = data.hourly.map((item) =>
      DetailedHourlyItemDto.fromDomain(item),
    );
    dto.daily = data.daily.map((item) => DetailedDailyItemDto.fromDomain(item));
    return dto;
  }
}
