import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { EntierBorne } from '../dto/bornes-annoncees.decorator';
import { AuPlusCaracteres } from '../dto/longueur-de-texte.decorator';

export class ChampsAntiRobotDto {
  @ApiPropertyOptional({
    description: 'Champ piège anti-robot, doit rester vide',
  })
  @IsOptional()
  @IsString()
  @AuPlusCaracteres(200)
  website?: string;

  @ApiPropertyOptional({
    description: "Timestamp ms d'ouverture du formulaire",
  })
  @IsOptional()
  @EntierBorne(0)
  formStartedAt?: number;
}
