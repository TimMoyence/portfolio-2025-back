import { Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';

const SECRET_LONGUEUR_MIN = 32;
const CONTEXTE = 'eleve';

@Injectable()
export class CleEtudiantService {
  de(email: string): string {
    return createHmac('sha256', this.secret())
      .update(`${CONTEXTE}:${email.trim().toLowerCase()}`)
      .digest('hex');
  }

  private secret(): string {
    const valeur = process.env.FORMATION_REVIEW_TOKEN_SECRET;
    if (!valeur || valeur.length < SECRET_LONGUEUR_MIN) {
      throw new Error(
        `FORMATION_REVIEW_TOKEN_SECRET doit etre configure avec au moins ${SECRET_LONGUEUR_MIN} caracteres`,
      );
    }
    return valeur;
  }
}
