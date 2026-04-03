import { ApiProperty } from '@nestjs/swagger';
import type { WeatherUserPreferences } from '../../domain/WeatherUserPreferences';

/** DTO de reponse des preferences meteo utilisateur. */
export class WeatherPreferencesDto {
  @ApiProperty({ description: 'Identifiant des preferences' })
  id: string;

  @ApiProperty({ description: "Identifiant de l'utilisateur" })
  userId: string;

  @ApiProperty({
    description: "Niveau d'experience meteo",
    enum: ['discovery', 'curious', 'expert'],
  })
  level: string;

  @ApiProperty({ description: 'Villes favorites' })
  favoriteCities: unknown[];

  @ApiProperty({ description: "Nombre de jours d'utilisation" })
  daysUsed: number;

  @ApiProperty({
    description: 'Date de derniere utilisation',
    nullable: true,
  })
  lastUsedAt: Date | null;

  @ApiProperty({ description: 'Identifiants des tooltips consultes' })
  tooltipsSeen: string[];

  @ApiProperty({ description: "Preferences d'unites de mesure" })
  units: { temperature: string; speed: string; pressure: string };

  @ApiProperty({ description: 'Date de creation' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de derniere mise a jour' })
  updatedAt: Date;

  /** Convertit un objet de domaine en DTO de reponse. */
  static fromDomain(prefs: WeatherUserPreferences): WeatherPreferencesDto {
    const dto = new WeatherPreferencesDto();
    dto.id = prefs.id;
    dto.userId = prefs.userId;
    dto.level = prefs.level;
    dto.favoriteCities = prefs.favoriteCities;
    dto.daysUsed = prefs.daysUsed;
    dto.lastUsedAt = prefs.lastUsedAt;
    dto.tooltipsSeen = prefs.tooltipsSeen;
    dto.units = prefs.units;
    dto.createdAt = prefs.createdAt;
    dto.updatedAt = prefs.updatedAt;
    return dto;
  }
}
