import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SebastianEntry } from '../../domain/SebastianEntry';

/** DTO de reponse pour une entree de consommation. */
export class EntryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() category: string;
  @ApiProperty() quantity: number;
  @ApiProperty() unit: string;
  @ApiProperty() date: string;
  @ApiPropertyOptional() notes: string | null;
  @ApiProperty() createdAt: string;
  @ApiPropertyOptional() drinkType: string | null;
  @ApiPropertyOptional() alcoholDegree: number | null;
  @ApiPropertyOptional() volumeCl: number | null;
  @ApiPropertyOptional() consumedAt: string | null;

  /** Convertit une entite domaine en DTO de reponse. */
  static fromDomain(entry: SebastianEntry): EntryResponseDto {
    const dto = new EntryResponseDto();
    dto.id = entry.id!;
    dto.userId = entry.userId;
    dto.category = entry.category;
    dto.quantity = Number(entry.quantity);
    dto.unit = entry.unit;
    dto.date =
      entry.date instanceof Date
        ? entry.date.toISOString().slice(0, 10)
        : String(entry.date);
    dto.notes = entry.notes;
    dto.createdAt = entry.createdAt?.toISOString() ?? '';
    dto.drinkType = entry.drinkType;
    dto.alcoholDegree = entry.alcoholDegree;
    dto.volumeCl = entry.volumeCl;
    dto.consumedAt = entry.consumedAt?.toISOString() ?? null;
    return dto;
  }
}
