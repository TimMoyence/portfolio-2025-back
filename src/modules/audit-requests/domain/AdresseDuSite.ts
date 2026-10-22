import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { requireHttpUrl } from '../../../common/domain/validation/domain-validators';

const SCHEMA_EXPLICITE = /^[a-z][a-z\d+\-.]*:\/\//i;
const CHAMP = 'audit website';

export function adresseDuSite(saisie: string): URL {
  const brute = saisie.trim();
  const avecSchema = SCHEMA_EXPLICITE.test(brute) ? brute : `https://${brute}`;
  const adresse = new URL(requireHttpUrl(avecSchema, CHAMP));
  if (adresse.username || adresse.password || !adresse.hostname.includes('.')) {
    throw new DomainValidationError(`Invalid ${CHAMP}`);
  }
  adresse.hash = '';
  return adresse;
}
