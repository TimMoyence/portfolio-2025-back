import { TelephoneOptionnel } from '../../../../common/interfaces/dto/telephone.decorator';
import type { UpdateProfileCommand } from '../../application/dto/UpdateProfile.command';
import { LONGUEUR_MAX_D_UN_TELEPHONE, NomDeCompte } from './regles-de-saisie';

export class UpdateProfileDto implements UpdateProfileCommand {
  @NomDeCompte('Le prenom', 'Jean', true)
  firstName?: string;

  @NomDeCompte('Le nom', 'Dupont', true)
  lastName?: string;

  @TelephoneOptionnel('+33612345678', LONGUEUR_MAX_D_UN_TELEPHONE)
  phone?: string | null;
}
