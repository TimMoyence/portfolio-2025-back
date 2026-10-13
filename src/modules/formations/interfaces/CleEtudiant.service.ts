import { Injectable } from '@nestjs/common';
import { requireEmail } from '../../../common/domain/validation/domain-validators';
import { signer } from '../application/SignatureFormations';

const CONTEXTE = 'eleve';

@Injectable()
export class CleEtudiantService {
  de(email: string): string {
    return signer(`${CONTEXTE}:${requireEmail(email, 'student email')}`);
  }
}
