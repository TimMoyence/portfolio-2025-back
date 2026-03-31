import { ApiProperty } from '@nestjs/swagger';
import type { DetailedForecastResult } from '../../domain/IOpenWeatherMapProxy.port';

/** DTO de reponse des previsions detaillees. */
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

  @ApiProperty({ description: 'Previsions horaires' })
  hourly: unknown[];

  @ApiProperty({ description: 'Agregation journaliere' })
  daily: unknown[];

  /** Convertit un objet de domaine en DTO de reponse. */
  static fromDomain(data: DetailedForecastResult): DetailedForecastDto {
    const dto = new DetailedForecastDto();
    Object.assign(dto, data);
    return dto;
  }
}
