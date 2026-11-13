import { ApiProperty } from '@nestjs/swagger';
import {
  LOCALES_SUPPORTEES,
  type SupportedLocale,
} from '../../../../common/domain/value-objects/LocaleCode';
import { AdresseEmail } from '../../../../common/interfaces/dto/champs/adresse-email.decorator';
import { VersionDesConditions } from '../../../../common/interfaces/dto/champs/conditions-acceptees.decorator';
import { LocaleSupportee } from '../../../../common/interfaces/dto/champs/locale-supportee.decorator';
import { ChampsAntiRobotDto } from '../../../../common/interfaces/security/anti-robot/champs-anti-robot.dto';
import { REPONSES_D_ABONNEMENT } from '../../application/SubscribeNewsletter.useCase';

export class SubscribeNewsletterRequestDto extends ChampsAntiRobotDto {
  @ApiProperty({ example: 'jane@example.com' })
  @AdresseEmail()
  email: string;

  @LocaleSupportee()
  locale: SupportedLocale;

  @VersionDesConditions()
  termsVersion: string;
}

export class AbonnementNewsletterResponseDto {
  @ApiProperty({
    example: REPONSES_D_ABONNEMENT.fr.message,
    description:
      'La même réponse pour toute adresse, dans la langue de la demande.',
  })
  message: string;
}

export class ConfirmationNewsletterResponseDto {
  @ApiProperty({ enum: ['confirmed'] })
  status: 'confirmed';

  @ApiProperty({ enum: LOCALES_SUPPORTEES })
  locale: SupportedLocale;
}

export class DesabonnementNewsletterResponseDto {
  @ApiProperty({ enum: ['unsubscribed'] })
  status: 'unsubscribed';
}
