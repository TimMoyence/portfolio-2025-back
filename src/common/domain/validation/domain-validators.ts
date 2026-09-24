import { DomainValidationError } from '../errors/DomainValidationError';

export function requireText(
  raw: unknown,
  field: string,
  min: number,
  max: number,
): string {
  if (typeof raw !== 'string')
    throw new DomainValidationError(`Invalid ${field}`);
  const value = raw.trim();
  if (value.length < min || value.length > max)
    throw new DomainValidationError(`Invalid ${field}`);
  return value;
}

export function optionalText(
  raw: unknown,
  field: string,
  max: number,
): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'string')
    throw new DomainValidationError(`Invalid ${field}`);
  const value = raw.trim();
  if (value.length === 0) return undefined;
  if (value.length > max) throw new DomainValidationError(`Invalid ${field}`);
  return value;
}

const LONGUEUR_MAX_URL = 1000;

export function requireHttpUrl(raw: unknown, field: string): string {
  const value = requireText(raw, field, 1, LONGUEUR_MAX_URL);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new DomainValidationError(`Invalid ${field}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new DomainValidationError(`Invalid ${field}`);
  }
  return value;
}

export function optionalHttpUrl(
  raw: unknown,
  field: string,
): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'string' && raw.trim().length === 0) return undefined;
  return requireHttpUrl(raw, field);
}

export function optionalMetadata(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
