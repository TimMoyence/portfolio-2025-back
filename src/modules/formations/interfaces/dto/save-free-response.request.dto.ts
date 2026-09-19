import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveFreeResponseRequestDto {
  @ApiProperty({ example: 'B2-01-S11-C1' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  screenId: string;

  @ApiProperty({ example: 'b2-s11-c1' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  activityId: string;

  @ApiProperty({ example: 'Je vérifie la période et la base.' })
  @IsString()
  @MaxLength(10000)
  response: string;

  @ApiProperty({ example: 12000 })
  @IsInt()
  @Min(0)
  @Max(5 * 60 * 60 * 1000)
  dureeMs: number;
}
