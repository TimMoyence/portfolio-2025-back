import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ChampsAntiRobotDto {
  @ApiPropertyOptional({
    description: 'Champ piège anti-robot, doit rester vide',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @ApiPropertyOptional({
    description:
      "Timestamp ms d'ouverture du formulaire, pris sur l'horloge du poste : accepté, jamais comparé",
    deprecated: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  formStartedAt?: number;

  @ApiPropertyOptional({
    description:
      'Durée de saisie en ms, mesurée par le poste sur une horloge monotone',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  formFillDurationMs?: number;
}
