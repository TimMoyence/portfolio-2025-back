import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** DTO des preferences d'unites de mesure. */
export class UnitPreferencesDto {
  @ApiProperty({
    example: 'celsius',
    required: false,
    description: 'Unite de temperature',
    enum: ['celsius', 'fahrenheit'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['celsius', 'fahrenheit'])
  temperature?: 'celsius' | 'fahrenheit';

  @ApiProperty({
    example: 'kmh',
    required: false,
    description: 'Unite de vitesse du vent',
    enum: ['kmh', 'mph'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['kmh', 'mph'])
  speed?: 'kmh' | 'mph';

  @ApiProperty({
    example: 'hpa',
    required: false,
    description: 'Unite de pression atmospherique',
    enum: ['hpa', 'inhg'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['hpa', 'inhg'])
  pressure?: 'hpa' | 'inhg';
}

/** DTO d'une ville favorite. */
export class FavoriteCityDto {
  @ApiProperty({ example: 'Paris', description: 'Nom de la ville' })
  @IsString()
  @MaxLength(100)
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
  @MaxLength(100)
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
  @ArrayMaxSize(20)
  favoriteCities?: FavoriteCityDto[];

  @ApiProperty({
    example: 0,
    required: false,
    nullable: true,
    description: 'Index de la ville favorite par defaut (null pour aucune)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  defaultCityIndex?: number | null;

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Identifiants des tooltips deja consultes',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(100)
  tooltipsSeen?: string[];

  @ApiProperty({
    type: UnitPreferencesDto,
    required: false,
    description: "Preferences d'unites de mesure",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UnitPreferencesDto)
  units?: UnitPreferencesDto;

  @ApiProperty({
    example: 'day',
    required: false,
    description: "Granularite de la vue d'ensemble hebdomadaire",
    enum: ['day', '3h', '1h'],
  })
  @IsOptional()
  @IsIn(['day', '3h', '1h'])
  overviewGranularity?: string;
}
