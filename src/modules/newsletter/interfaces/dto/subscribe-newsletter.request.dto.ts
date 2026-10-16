import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';
import { AdresseEmail } from '../../../../common/interfaces/dto/adresse-email.decorator';
import { LocaleSupportee } from '../../../../common/interfaces/dto/locale-supportee.decorator';
import { IsIn, IsOptional, IsString } from 'class-validator';
import {
  AcceptationDesConditions,
  VersionDesConditions,
} from '../../../../common/interfaces/dto/conditions-acceptees.decorator';
import {
  AuPlusCaracteres,
  Rogne,
  TexteSaisi,
} from '../../../../common/interfaces/dto/longueur-de-texte.decorator';
import { ChampsAntiRobotDto } from '../../../../common/interfaces/security/champs-anti-robot.dto';
import { SUPPORTED_FORMATION_SLUGS } from '../../domain/SupportedFormationSlugs';

export class SubscribeNewsletterRequestDto extends ChampsAntiRobotDto {
  @ApiProperty({ example: 'marie@example.com' })
  @AdresseEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Marie' })
  @IsOptional()
  @Rogne()
  @IsString()
  @AuPlusCaracteres(50)
  firstName?: string;

  @LocaleSupportee()
  locale: SupportedLocale;

  @ApiProperty({
    example: 'ia-solopreneurs',
    enum: SUPPORTED_FORMATION_SLUGS,
  })
  @TexteSaisi(1, 100)
  @IsIn(SUPPORTED_FORMATION_SLUGS as unknown as readonly string[])
  sourceFormationSlug: string;

  @VersionDesConditions()
  termsVersion: string;

  @AcceptationDesConditions()
  termsAcceptedAt: Date;
}
