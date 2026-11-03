import { ValeurDuContrat } from '../../../../common/interfaces/dto/valeur-du-contrat.decorator';
import {
  METHODES_DE_CONTACT,
  type MethodeDeContact,
} from '../../domain/demande/AuditRequest';
import { ApiProperty } from '@nestjs/swagger';
import type { AuditLocale } from '../../domain/traitement/audit-locale.util';
import { LocaleSupportee } from '../../../../common/interfaces/dto/champs/locale-supportee.decorator';
import { TexteSaisi } from '../../../../common/interfaces/dto/champs/longueur-de-texte.decorator';
import { ChampsAntiRobotDto } from '../../../../common/interfaces/security/anti-robot/champs-anti-robot.dto';

export class AuditRequestRequestDto extends ChampsAntiRobotDto {
  @ApiProperty({ example: 'https://example.com' })
  @TexteSaisi(2, 200)
  websiteName: string;

  @ValeurDuContrat(METHODES_DE_CONTACT, 'MethodeDeContact', {
    documentation: { example: 'EMAIL' },
  })
  contactMethod: MethodeDeContact;

  @ApiProperty({ example: 'hello@example.com' })
  @TexteSaisi(6, 200)
  contactValue: string;

  @LocaleSupportee({ facultative: true })
  locale?: AuditLocale;
}
