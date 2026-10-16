import {
  LocaleCode,
  LOCALES_SUPPORTEES,
  type SupportedLocale,
} from '../../../common/domain/value-objects/LocaleCode';

export type AuditLocale = SupportedLocale;

const LOCALE_DANS_UN_CHEMIN = new RegExp(
  `(?:^|/)(${LOCALES_SUPPORTEES.join('|')})(?:/|$)`,
);

export function localeDeRedaction(
  demandee: unknown,
  langueConfiguree: unknown,
): AuditLocale {
  return LocaleCode.resolve(
    demandee,
    LocaleCode.resolve(langueConfiguree).value,
  ).value;
}

export function localeFromUrlPath(path: unknown): AuditLocale | null {
  if (typeof path !== 'string') {
    return null;
  }

  const match = LOCALE_DANS_UN_CHEMIN.exec(path.toLowerCase());
  return match ? LocaleCode.resolve(match[1]).value : null;
}
