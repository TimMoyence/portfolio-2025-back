import { IsEmail } from 'class-validator';
import { REGLE_D_UNE_ADRESSE_EMAIL } from '../../domain/value-objects/EmailAddress';

export function AdresseEmail(): PropertyDecorator {
  return IsEmail(REGLE_D_UNE_ADRESSE_EMAIL);
}
