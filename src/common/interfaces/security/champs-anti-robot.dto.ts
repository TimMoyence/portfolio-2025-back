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
    description:
      "Timestamp ms d'ouverture du formulaire, pris sur l'horloge du poste : accepté, jamais comparé",
    deprecated: true,
  })
  @IsOptional()
  @EntierBorne(0)
  formStartedAt?: number;

  @ApiPropertyOptional({
    description:
      'Durée de saisie en ms, mesurée par le poste sur une horloge monotone',
  })
  @IsOptional()
  @EntierBorne(0)
  formFillDurationMs?: number;
}
