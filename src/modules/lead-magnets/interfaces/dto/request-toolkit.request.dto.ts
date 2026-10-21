import { ValeurDuContrat } from '../../../../common/interfaces/dto/valeur-du-contrat.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { AdresseEmail } from '../../../../common/interfaces/dto/adresse-email.decorator';
import {
  Rogne,
  TexteSaisi,
} from '../../../../common/interfaces/dto/longueur-de-texte.decorator';
import {
  AcceptationDesConditions,
  VersionDesConditions,
} from '../../../../common/interfaces/dto/conditions-acceptees.decorator';
import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';
import { LocaleSupportee } from '../../../../common/interfaces/dto/locale-supportee.decorator';
import { ChampsAntiRobotDto } from '../../../../common/interfaces/security/champs-anti-robot.dto';

const FORMATIONS_DE_LA_BOITE = ['ia-solopreneurs'];

export class RequestToolkitRequestDto extends ChampsAntiRobotDto {
  @ApiProperty({ example: 'Marie' })
  @TexteSaisi(1, 50)
  firstName: string;

  @ApiProperty({ example: 'marie@example.com' })
  @AdresseEmail()
  email: string;

  @ValeurDuContrat(FORMATIONS_DE_LA_BOITE, 'FormationDeLaBoite', {
    documentation: { example: 'ia-solopreneurs' },
  })
  @Rogne()
  formationSlug: string;

  @VersionDesConditions()
  termsVersion: string;

  @LocaleSupportee()
  termsLocale: SupportedLocale;

  @AcceptationDesConditions()
  termsAcceptedAt: Date;
}
