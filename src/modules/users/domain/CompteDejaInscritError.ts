import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';

const ADRESSE_OU_COMPTE_GOOGLE_PRIS =
  'Adresse ou compte Google deja utilise par un autre compte';

export class CompteDejaInscritError extends ResourceConflictError {
  constructor() {
    super(ADRESSE_OU_COMPTE_GOOGLE_PRIS);
  }
}
