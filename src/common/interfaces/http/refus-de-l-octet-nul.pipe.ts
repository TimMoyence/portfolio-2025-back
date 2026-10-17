import {
  type ArgumentMetadata,
  BadRequestException,
  type PipeTransform,
} from '@nestjs/common';
import { estObjet } from '../../domain/est-objet';

export const MESSAGE_D_OCTET_NUL = 'Une saisie contient un caractère nul.';

const OCTET_NUL = '\u0000';

const SAISIES_DE_LA_REQUETE: ReadonlySet<ArgumentMetadata['type']> = new Set([
  'body',
  'query',
  'param',
]);

export class RefusDeLOctetNulPipe implements PipeTransform {
  transform(valeur: unknown, { type }: ArgumentMetadata): unknown {
    if (SAISIES_DE_LA_REQUETE.has(type) && contientUnOctetNul(valeur)) {
      throw new BadRequestException(MESSAGE_D_OCTET_NUL);
    }
    return valeur;
  }
}

function contientUnOctetNul(saisie: unknown): boolean {
  const aVisiter: unknown[] = [saisie];
  while (aVisiter.length > 0) {
    const valeur = aVisiter.pop();
    if (typeof valeur === 'string') {
      if (valeur.includes(OCTET_NUL)) return true;
    } else if (Array.isArray(valeur) || estObjet(valeur)) {
      for (const [cle, enfant] of Object.entries(valeur)) {
        if (cle.includes(OCTET_NUL)) return true;
        aVisiter.push(enfant);
      }
    }
  }
  return false;
}
