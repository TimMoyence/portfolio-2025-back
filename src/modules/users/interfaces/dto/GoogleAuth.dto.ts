import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';
import { LocaleSupportee } from '../../../../common/interfaces/dto/champs/locale-supportee.decorator';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token reçu du client GIS',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @LocaleSupportee({ facultative: true, parDefaut: 'fr' })
  locale?: SupportedLocale;
}
