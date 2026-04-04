import { DomainValidationError } from '../errors/DomainValidationError';
import type { PublishableStatus } from '../types/publishable-status';

const VALID_STATUSES: readonly PublishableStatus[] = [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
];

/**
 * Resout un statut de publication a partir d'une valeur brute.
 * Normalise la casse (trim + uppercase) et valide l'appartenance
 * aux valeurs autorisees.
 *
 * @param raw   Valeur brute (string attendue)
 * @param field Nom du champ pour le message d'erreur
 * @returns Le statut normalise, ou 'PUBLISHED' par defaut
 */
export function resolvePublishableStatus(
  raw: unknown,
  field: string,
): PublishableStatus {
  if (raw === undefined || raw === null) {
    return 'PUBLISHED';
  }

  if (typeof raw !== 'string') {
    throw new DomainValidationError(`Invalid ${field}`);
  }

  const normalized = raw.trim().toUpperCase();
  if (!VALID_STATUSES.includes(normalized as PublishableStatus)) {
    throw new DomainValidationError(`Invalid ${field}`);
  }

  return normalized as PublishableStatus;
}

/**
 * Resout un ordre de tri (entier positif) a partir d'une valeur brute.
 *
 * @param raw   Valeur brute (number entier attendu)
 * @param field Nom du champ pour le message d'erreur
 * @returns L'ordre valide, ou 0 par defaut
 */
export function resolveOrder(raw: unknown, field: string): number {
  if (raw === undefined || raw === null) {
    return 0;
  }

  if (!Number.isInteger(raw)) {
    throw new DomainValidationError(`Invalid ${field}`);
  }

  const value = Number(raw);
  if (value < 0 || value > 10000) {
    throw new DomainValidationError(`Invalid ${field}`);
  }

  return value;
}
