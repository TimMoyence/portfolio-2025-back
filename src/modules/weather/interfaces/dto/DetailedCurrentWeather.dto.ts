import { ApiProperty } from '@nestjs/swagger';
import type { DetailedCurrentWeather } from '../../domain/IOpenWeatherMapProxy.port';

/** Cles publiees verrouillees par weather-wire-contract.spec.ts. */
export class DetailedCurrentWeatherDto {
  @ApiProperty({ description: 'Temperature (°C)' })
  temperature: number;

  @ApiProperty({ description: 'Temperature ressentie (°C)' })
  feelsLike: number;

  @ApiProperty({ description: 'Temperature minimale (°C)' })
  minTemp: number;

  @ApiProperty({ description: 'Temperature maximale (°C)' })
  maxTemp: number;

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

  @ApiProperty({ description: 'Pluie derniere heure (mm)' })
  rain1h: number;

  @ApiProperty({ description: 'Neige derniere heure (mm)' })
  snow1h: number;

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

  @ApiProperty({ description: 'Heure lever de soleil (ISO)' })
  sunrise: string;

  @ApiProperty({ description: 'Heure coucher de soleil (ISO)' })
  sunset: string;

  @ApiProperty({ description: 'Est-ce le jour' })
  isDaytime: boolean;

  @ApiProperty({
    description: 'Partie de la journee',
    enum: ['d', 'n'],
  })
  partOfDay: 'd' | 'n';

  @ApiProperty({ description: 'Decalage horaire (secondes)' })
  timezoneOffset: number;

  static fromDomain(data: DetailedCurrentWeather): DetailedCurrentWeatherDto {
    const dto = new DetailedCurrentWeatherDto();
    dto.temperature = data.temperatureCelsius;
    dto.feelsLike = data.feelsLikeCelsius;
    dto.minTemp = data.minTempCelsius;
    dto.maxTemp = data.maxTempCelsius;
    dto.humidity = data.humidityPercent;
    dto.seaLevelPressure = data.seaLevelPressureHpa;
    dto.groundLevelPressure = data.groundLevelPressureHpa;
    dto.windSpeed = data.windSpeedKmh;
    dto.windGust = data.windGustKmh;
    dto.windDirection = data.windDirectionDegrees;
    dto.cloudCover = data.cloudCoverPercent;
    dto.visibility = data.visibilityKm;
    dto.rain1h = data.rain1hMm;
    dto.snow1h = data.snow1hMm;
    dto.precipitationProbability = data.precipitationProbabilityPercent;
    dto.conditionId = data.conditionId;
    dto.conditionName = data.conditionName;
    dto.conditionText = data.conditionText;
    dto.conditionIcon = data.conditionIcon;
    dto.sunrise = data.sunriseIso;
    dto.sunset = data.sunsetIso;
    dto.isDaytime = data.isDaytime;
    dto.partOfDay = data.partOfDay;
    dto.timezoneOffset = data.timezoneOffsetSeconds;
    return dto;
  }
}
