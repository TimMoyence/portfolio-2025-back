import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ChampsAntiRobotDto } from '../../../../common/interfaces/security/champs-anti-robot.dto';
import {
  LONGUEUR_MAX_D_UN_NOM_DE_PARTICIPANT,
  LONGUEUR_MAX_D_UNE_ADRESSE_DE_PARTICIPANT,
} from '../../domain/IParticipants.repository';

export class JoinSessionRequestDto extends ChampsAntiRobotDto {
  @ApiProperty({ example: 'Theo' })
  @IsString()
  @MinLength(1)
  @MaxLength(LONGUEUR_MAX_D_UN_NOM_DE_PARTICIPANT)
  prenom: string;

  @ApiProperty({ example: 'Martin' })
  @IsString()
  @MinLength(1)
  @MaxLength(LONGUEUR_MAX_D_UN_NOM_DE_PARTICIPANT)
  nom: string;

  @ApiProperty({ example: 'theo.martin@example.com' })
  @IsEmail()
  @MaxLength(LONGUEUR_MAX_D_UNE_ADRESSE_DE_PARTICIPANT)
  email: string;

  @ApiPropertyOptional({
    description:
      'Secret remis par la jonction precedente de ce poste ; exige pour reprendre une place deja prise',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  secretDeReprise?: string;
}
