import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DureeDeReponse } from './duree-de-reponse.decorator';

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

  @DureeDeReponse(12000)
  dureeMs: number;
}
