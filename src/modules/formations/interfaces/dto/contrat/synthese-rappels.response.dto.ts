import { ApiProperty } from '@nestjs/swagger';

export class SyntheseConceptResponseDto {
  @ApiProperty({ example: 'evolution-reciproque' })
  concept: string;

  @ApiProperty({ example: 'Évolution réciproque' })
  libelle: string;

  @ApiProperty({ example: 6 })
  boite1: number;

  @ApiProperty({ example: 14 })
  boite2: number;

  @ApiProperty({ example: 3 })
  boite3: number;

  @ApiProperty({ example: 1 })
  nonVus: number;
}

export class SyntheseRappelsResponseDto {
  @ApiProperty({ type: [SyntheseConceptResponseDto] })
  concepts: SyntheseConceptResponseDto[];
}
