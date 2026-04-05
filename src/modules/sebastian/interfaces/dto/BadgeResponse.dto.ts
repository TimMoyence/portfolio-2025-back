import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { BadgeStatusResult } from '../../application/services/ListBadges.useCase';

/** DTO de reponse pour le statut d'un badge. */
export class BadgeStatusDto {
  @ApiProperty({ description: 'Cle unique du badge' })
  key: string;

  @ApiProperty({ description: 'Nom affichable du badge' })
  name: string;

  @ApiProperty({ description: 'Description du badge' })
  description: string;

  @ApiProperty({
    description: 'Categorie du badge',
    enum: ['alcohol', 'coffee', 'global'],
  })
  category: string;

  @ApiProperty({ description: 'Indique si le badge est debloque' })
  unlocked: boolean;

  @ApiPropertyOptional({
    description: 'Date de deblocage au format ISO (si debloque)',
  })
  unlockedAt?: string;

  /** Convertit un resultat de statut de badge en DTO de reponse. */
  static fromResult(result: BadgeStatusResult): BadgeStatusDto {
    const dto = new BadgeStatusDto();
    dto.key = result.key;
    dto.name = result.name;
    dto.description = result.description;
    dto.category = result.category;
    dto.unlocked = result.unlocked;
    dto.unlockedAt = result.unlockedAt;
    return dto;
  }
}
