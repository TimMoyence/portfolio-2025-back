import type { AuditLocale } from './audit-locale.util';

const MARQUEURS: Readonly<Record<AuditLocale, string>> = {
  fr: 'Non verifiable',
  en: 'Not verifiable',
};

export function nonVerifiable(locale: AuditLocale): string {
  return MARQUEURS[locale];
}

export function estNonVerifiable(texte: string): boolean {
  const normalise = texte.toLowerCase();
  return Object.values(MARQUEURS).some((marqueur) =>
    normalise.includes(marqueur.toLowerCase()),
  );
}
