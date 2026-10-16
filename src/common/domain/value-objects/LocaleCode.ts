export const LOCALES_SUPPORTEES = ['fr', 'en'] as const;

export type SupportedLocale = (typeof LOCALES_SUPPORTEES)[number];

export function estUneLocaleSupportee(
  valeur: unknown,
): valeur is SupportedLocale {
  return LOCALES_SUPPORTEES.some((supportee) => supportee === valeur);
}

export class LocaleCode {
  private constructor(private readonly normalizedValue: SupportedLocale) {}

  static parse(raw: unknown): LocaleCode | null {
    if (typeof raw !== 'string') return null;

    const langue = raw.trim().toLowerCase().split('-')[0];
    return estUneLocaleSupportee(langue) ? new LocaleCode(langue) : null;
  }

  static resolve(raw: unknown, fallback: SupportedLocale = 'fr'): LocaleCode {
    return LocaleCode.parse(raw) ?? new LocaleCode(fallback);
  }

  get value(): SupportedLocale {
    return this.normalizedValue;
  }
}
