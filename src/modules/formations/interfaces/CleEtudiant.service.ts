import { Injectable } from '@nestjs/common';
import { signer } from '../application/SignatureFormations';

const CONTEXTE = 'eleve';

@Injectable()
export class CleEtudiantService {
  de(email: string): string {
    return signer(`${CONTEXTE}:${email.trim().toLowerCase()}`);
  }
}
