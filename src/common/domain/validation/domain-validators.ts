import { DomainValidationError } from '../errors/DomainValidationError';
import { dansLesBornes } from '../nombres/dans-les-bornes';
import { longueurDeTexte } from '../texte/longueur-de-texte';
import { EmailAddress } from '../value-objects/EmailAddress';
import { LocaleCode, type SupportedLocale } from '../value-objects/LocaleCode';
import { PhoneNumber } from '../value-objects/PhoneNumber';

export function requireEmail(raw: unknown, field: string): string {
  const email = EmailAddress.parse(raw);
  if (email === null) throw new DomainValidationError(`Invalid ${field}`);
  return email.value;
}

export function optionalPhone(raw: unknown, field: string): string | null {
  const saisie = optionalText(raw, field, Infinity);
  if (saisie === undefined) return null;
  const telephone = PhoneNumber.parse(saisie);
  if (telephone === null) throw new DomainValidationError(`Invalid ${field}`);
  return telephone.value;
}

export function requireLocale(raw: unknown, field: string): SupportedLocale {
  const locale = LocaleCode.parse(raw);
  if (locale === null) throw new DomainValidationError(`Invalid ${field}`);
  return locale.value;
}

export function requireBoolean(raw: unknown, field: string): boolean {
  if (typeof raw !== 'boolean') {
    throw new DomainValidationError(`Invalid ${field}`);
  }
  return raw;
}

export function requireText(
  raw: unknown,
  field: string,
  min: number,
  max: number,
): string {
  if (typeof raw !== 'string')
    throw new DomainValidationError(`Invalid ${field}`);
  const value = raw.trim();
  if (!dansLesBornes(longueurDeTexte(value), { min, max }))
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
  if (longueurDeTexte(value) > max)
    throw new DomainValidationError(`Invalid ${field}`);
  return value;
}

export function requireValidDate(raw: unknown, field: string): Date {
  if (!(raw instanceof Date) || Number.isNaN(raw.getTime())) {
    throw new DomainValidationError(`Invalid ${field} date`);
  }
  return raw;
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
