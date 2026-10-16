import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
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
  @IsInt()
  @Min(0)
  formStartedAt?: number;
}
