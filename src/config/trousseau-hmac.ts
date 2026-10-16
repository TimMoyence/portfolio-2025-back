import { envListe, type SourceDEnv } from './env-readers.util';

export interface CleDuTrousseau {
  readonly id: string;
  readonly secret: string;
}

export function trousseauHmac(
  source: SourceDEnv = process.env,
): CleDuTrousseau[] {
  return envListe('MORNING_BRIEF_HMAC_KEYS', source).map((entree) => {
    const separateur = entree.indexOf(':');
    return separateur > 0
      ? {
          id: entree.slice(0, separateur),
          secret: entree.slice(separateur + 1),
        }
      : { id: '', secret: '' };
  });
}
