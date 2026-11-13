import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';
import { AdresseEmail } from '../../../../common/interfaces/dto/champs/adresse-email.decorator';
import { LocaleSupportee } from '../../../../common/interfaces/dto/champs/locale-supportee.decorator';
import { TelephoneOptionnel } from '../../../../common/interfaces/dto/champs/telephone.decorator';
import type { InscriptionCommand } from '../../application/dto/CreateUser.command';
import {
  LONGUEUR_MAX_D_UN_TELEPHONE,
  MotDePasseRobuste,
  NomDeCompte,
} from './regles-de-saisie';

export class InscriptionDto implements InscriptionCommand {
  @ApiProperty({ example: 'john@example.com' })
  @AdresseEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @MotDePasseRobuste()
  @IsNotEmpty()
  password: string;

  @NomDeCompte('Le prenom', 'John')
  firstName: string;

  @NomDeCompte('Le nom', 'Doe')
  lastName: string;

  @TelephoneOptionnel('+11234567890', LONGUEUR_MAX_D_UN_TELEPHONE)
  phone?: string | null;

  @LocaleSupportee({ facultative: true, parDefaut: 'fr' })
  locale?: SupportedLocale;
}
