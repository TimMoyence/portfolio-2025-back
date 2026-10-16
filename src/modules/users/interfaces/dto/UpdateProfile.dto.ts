import type { UpdateProfileCommand } from '../../application/dto/UpdateProfile.command';
import { NomDeCompte, TelephoneOptionnel } from './regles-de-saisie';

export class UpdateProfileDto implements UpdateProfileCommand {
  @NomDeCompte('Le prenom', 'Jean', true)
  firstName?: string;

  @NomDeCompte('Le nom', 'Dupont', true)
  lastName?: string;

  @TelephoneOptionnel('+33612345678')
  phone?: string | null;
}
