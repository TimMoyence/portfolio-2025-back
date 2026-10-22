import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Equals, IsDate, IsOptional, IsString } from 'class-validator';
import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';
import { AdresseEmail } from '../../../../common/interfaces/dto/adresse-email.decorator';
import { LocaleSupportee } from '../../../../common/interfaces/dto/locale-supportee.decorator';
import {
  AuPlusCaracteres,
  Rogne,
  TexteSaisi,
} from '../../../../common/interfaces/dto/longueur-de-texte.decorator';
import { TelephoneOptionnel } from '../../../../common/interfaces/dto/telephone.decorator';
import { ChampsAntiRobotDto } from '../../../../common/interfaces/security/champs-anti-robot.dto';

export class ContactRequestDto extends ChampsAntiRobotDto {
  @ApiProperty({ example: 'John' })
  @TexteSaisi(1, 50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @TexteSaisi(1, 50)
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @AdresseEmail()
  email: string;

  @ApiProperty({ example: 'Hello, I would like to get in touch.' })
  @TexteSaisi(10, 2000)
  message: string;

  @TelephoneOptionnel('+11234567890')
  phone?: string | null;

  @ApiProperty({ example: 'Devis Asking' })
  @TexteSaisi(2, 100)
  subject: string;

  @ApiProperty({ example: 'Manager' })
  @TexteSaisi(2, 100)
  role: string;

  @ApiProperty({ oneOf: [{ type: 'boolean', enum: [true] }], example: true })
  @Equals(true)
  terms: true;

  @ApiProperty({ example: '2026-02-11', required: false })
  @IsOptional()
  @Rogne()
  @IsString()
  @AuPlusCaracteres(50)
  termsVersion?: string;

  @LocaleSupportee({ facultative: true })
  termsLocale?: SupportedLocale;

  @ApiProperty({ example: 'contact_form_checkbox', required: false })
  @IsOptional()
  @Rogne()
  @IsString()
  @AuPlusCaracteres(50)
  termsMethod?: string;

  @ApiProperty({ example: '2026-02-11T10:45:00.000Z', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  termsAcceptedAt?: Date;
}
