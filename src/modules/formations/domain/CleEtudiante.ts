import { requireEmail } from '../../../common/domain/validation/domain-validators';
import { signer } from './SignatureFormations';

const CONTEXTE = 'eleve';

export function cleEtudianteDe(email: string): string {
  return signer(`${CONTEXTE}:${requireEmail(email, 'student email')}`);
}
