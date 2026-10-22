import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { AdresseEmail } from '../../../../common/interfaces/dto/adresse-email.decorator';
import { TelephoneOptionnel } from '../../../../common/interfaces/dto/telephone.decorator';
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
}
