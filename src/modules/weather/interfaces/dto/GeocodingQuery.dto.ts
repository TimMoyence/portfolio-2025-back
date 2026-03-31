import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GeocodingQueryDto {
  @ApiProperty({
    example: 'Paris',
    description: 'Nom de la ville a rechercher',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'fr',
    required: false,
    description: 'Langue des resultats',
  })
  @IsOptional()
  @IsString()
  language?: string = 'fr';

  @ApiProperty({
    example: 5,
    required: false,
    description: 'Nombre maximum de resultats',
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(10)
  count?: number = 5;
}
