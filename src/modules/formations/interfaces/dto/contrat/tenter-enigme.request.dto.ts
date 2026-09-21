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

export class TenterEnigmeRequestDto {
  @ApiProperty({ example: 'enigme-1' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  enigmeId: string;

  @ApiProperty({
    description:
      'Saisie brute, lue par lireNombreSaisi pour une solution chiffree',
    example: '142 920',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  reponse: string;

  @ApiProperty({ example: 42000 })
  @IsInt()
  @Min(0)
  @Max(DUREE_MAX_MS)
  dureeMs: number;
}
