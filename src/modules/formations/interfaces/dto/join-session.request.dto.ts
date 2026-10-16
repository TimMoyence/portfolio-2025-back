import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AdresseEmail } from '../../../../common/interfaces/dto/adresse-email.decorator';
import {
  AuPlusCaracteres,
  TexteBorne,
} from '../../../../common/interfaces/dto/longueur-de-texte.decorator';
import { ChampsAntiRobotDto } from '../../../../common/interfaces/security/champs-anti-robot.dto';
import {
  LONGUEUR_MAX_D_UN_NOM_DE_PARTICIPANT,
  LONGUEUR_MAX_D_UNE_ADRESSE_DE_PARTICIPANT,
} from '../../domain/IParticipants.repository';

export class JoinSessionRequestDto extends ChampsAntiRobotDto {
  @ApiProperty({ example: 'Theo' })
  @TexteBorne(1, LONGUEUR_MAX_D_UN_NOM_DE_PARTICIPANT)
  prenom: string;

  @ApiProperty({ example: 'Martin' })
  @TexteBorne(1, LONGUEUR_MAX_D_UN_NOM_DE_PARTICIPANT)
  nom: string;

  @ApiProperty({ example: 'theo.martin@example.com' })
  @AdresseEmail()
  @AuPlusCaracteres(LONGUEUR_MAX_D_UNE_ADRESSE_DE_PARTICIPANT)
  email: string;

  @ApiPropertyOptional({
    description:
      'Secret remis par la jonction precedente de ce poste ; exige pour reprendre une place deja prise',
  })
  @IsOptional()
  @IsString()
  @AuPlusCaracteres(128)
  secretDeReprise?: string;
}
