import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  AuPlusCaracteres,
  TexteBorne,
} from '../../../../common/interfaces/dto/longueur-de-texte.decorator';
import { DureeDeReponse } from './duree-de-reponse.decorator';

export class SaveFreeResponseRequestDto {
  @ApiProperty({ example: 'B2-01-S11-C1' })
  @TexteBorne(1, 120)
  screenId: string;

  @ApiProperty({ example: 'b2-s11-c1' })
  @TexteBorne(1, 120)
  activityId: string;

  @ApiProperty({ example: 'Je vérifie la période et la base.' })
  @IsString()
  @AuPlusCaracteres(10000)
  response: string;

  @DureeDeReponse(12000)
  dureeMs: number;
}
