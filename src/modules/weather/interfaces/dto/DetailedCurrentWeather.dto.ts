import { ApiProperty } from '@nestjs/swagger';
import type { DetailedCurrentWeather } from '../../domain/IOpenWeatherMapProxy.port';

/** DTO de reponse des donnees meteo detaillees courantes. */
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

  /** Convertit un objet de domaine en DTO de reponse. */
  static fromDomain(data: DetailedCurrentWeather): DetailedCurrentWeatherDto {
    const dto = new DetailedCurrentWeatherDto();
    Object.assign(dto, data);
    return dto;
  }
}
