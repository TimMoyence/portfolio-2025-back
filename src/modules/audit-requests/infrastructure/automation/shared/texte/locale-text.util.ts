import { AuditLocale } from '../../../../domain/traitement/audit-locale.util';

export function localizedText(
  locale: AuditLocale,
  fr: string,
  en: string,
): string {
  return locale === 'en' ? en : fr;
}
