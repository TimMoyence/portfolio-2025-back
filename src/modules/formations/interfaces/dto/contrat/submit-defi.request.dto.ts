import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const DUREE_MAX_MS = 5 * 60 * 60 * 1000;

export class SubmitDefiRequestDto {
  @ApiProperty({
    description: 'Tentative du participant, la premiere envoyee est figee',
    example: 'Multiplier les coefficients de chaque revision.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  texte: string;

  @ApiProperty({ example: 180000 })
  @IsInt()
  @Min(0)
  @Max(DUREE_MAX_MS)
  dureeMs: number;
}
