import { DomainValidationError } from '../errors/DomainValidationError';
import type { PublishableStatus } from '../types/publishable-status';

const VALID_STATUSES: readonly PublishableStatus[] = [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
];

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

export function resolveCompteurBorne(
  raw: unknown,
  field: string,
  maximum: number,
): number {
  if (raw === undefined || raw === null) {
    return 0;
  }

  if (!Number.isInteger(raw)) {
    throw new DomainValidationError(`Invalid ${field}`);
  }

  const value = Number(raw);
  if (value < 0 || value > maximum) {
    throw new DomainValidationError(`Invalid ${field}`);
  }

  return value;
}

export function resolveOrder(raw: unknown, field: string): number {
  return resolveCompteurBorne(raw, field, 10000);
}
