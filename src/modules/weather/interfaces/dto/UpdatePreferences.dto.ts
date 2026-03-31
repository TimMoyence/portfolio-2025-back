import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/** DTO d'une ville favorite. */
export class FavoriteCityDto {
  @ApiProperty({ example: 'Paris', description: 'Nom de la ville' })
  @IsString()
  name: string;

  @ApiProperty({ example: 48.8566, description: 'Latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 2.3522, description: 'Longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 'France', description: 'Pays' })
  @IsString()
  country: string;
}

/** DTO de mise a jour des preferences meteo. */
export class UpdatePreferencesDto {
  @ApiProperty({
    example: 'curious',
    required: false,
    description: "Niveau d'experience meteo",
    enum: ['discovery', 'curious', 'expert'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['discovery', 'curious', 'expert'])
  level?: 'discovery' | 'curious' | 'expert';

  @ApiProperty({
    type: [FavoriteCityDto],
    required: false,
    description: 'Villes favorites',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FavoriteCityDto)
  favoriteCities?: FavoriteCityDto[];

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Identifiants des tooltips deja consultes',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tooltipsSeen?: string[];
}
