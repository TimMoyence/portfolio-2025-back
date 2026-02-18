export type AuditLocale = 'fr' | 'en';

export function resolveAuditLocale(
  value: unknown,
  fallback: AuditLocale = 'fr',
): AuditLocale {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }
  if (normalized === 'fr' || normalized.startsWith('fr-')) {
    return 'fr';
  }
  return fallback;
}

export function localeFromUrlPath(path: unknown): AuditLocale | null {
  if (typeof path !== 'string') {
    return null;
  }

  const match = path.toLowerCase().match(/(?:^|\/)(fr|en)(?:\/|$)/);
  if (!match) {
    return null;
  }
  return resolveAuditLocale(match[1], 'fr');
}
