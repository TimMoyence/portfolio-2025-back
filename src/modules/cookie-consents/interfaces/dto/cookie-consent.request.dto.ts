import { ValeurDuContrat } from '../../../../common/interfaces/dto/valeur-du-contrat.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, ValidateNested } from 'class-validator';
import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';
import { LocaleSupportee } from '../../../../common/interfaces/dto/locale-supportee.decorator';
import { TexteSaisi } from '../../../../common/interfaces/dto/longueur-de-texte.decorator';
import {
  ACTIONS_DE_CONSENTEMENT,
  SOURCES_DE_CONSENTEMENT,
  type CreateCookieConsentProps,
} from '../../domain/CookieConsent';

class CookieConsentPreferencesRequestDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  essential: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  preferences: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  analytics: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  marketing: boolean;
}

export class CookieConsentRequestDto {
  @ApiProperty({ example: '2026-02-11' })
  @TexteSaisi(1, 50)
  policyVersion: string;

  @LocaleSupportee()
  locale: SupportedLocale;

  @ApiProperty({ example: 'EU_UK' })
  @TexteSaisi(1, 20)
  region: string;

  @ValeurDuContrat(SOURCES_DE_CONSENTEMENT, 'SourceDeConsentement', {
    documentation: { example: 'banner' },
  })
  source: CreateCookieConsentProps['source'];

  @ValeurDuContrat(ACTIONS_DE_CONSENTEMENT, 'ActionDeConsentement', {
    documentation: { example: 'accept_all' },
  })
  action: CreateCookieConsentProps['action'];

  @ApiProperty({ type: CookieConsentPreferencesRequestDto })
  @ValidateNested()
  @Type(() => CookieConsentPreferencesRequestDto)
  preferences: CookieConsentPreferencesRequestDto;
}
