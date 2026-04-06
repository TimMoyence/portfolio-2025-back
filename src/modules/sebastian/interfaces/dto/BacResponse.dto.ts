import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { BacResult } from '../../domain/BacCalculator';

/** Point de la courbe BAC. */
class BacDataPointDto {
  @ApiProperty() time: string;
  @ApiProperty() bac: number;
}

/** DTO de reponse pour le taux d'alcoolemie. */
export class BacResponseDto {
  @ApiProperty() currentBac: number;
  @ApiProperty({ type: [BacDataPointDto] }) curve: BacDataPointDto[];
  @ApiPropertyOptional() estimatedSoberAt: string | null;
  @ApiProperty() legalLimit: number;

  /** Convertit un resultat domaine en DTO de reponse. */
  static fromResult(result: BacResult): BacResponseDto {
    const dto = new BacResponseDto();
    dto.currentBac = result.currentBac;
    dto.curve = result.curve.map((p) => ({
      time: p.time.toISOString(),
      bac: p.bac,
    }));
    dto.estimatedSoberAt = result.estimatedSoberAt?.toISOString() ?? null;
    dto.legalLimit = 0.5;
    return dto;
  }
}
