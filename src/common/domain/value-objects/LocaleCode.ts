export const LOCALES_SUPPORTEES = ['fr', 'en'] as const;

export type SupportedLocale = (typeof LOCALES_SUPPORTEES)[number];

export class LocaleCode {
  private constructor(private readonly normalizedValue: SupportedLocale) {}

  static parse(raw: unknown): LocaleCode | null {
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim().toLowerCase();
    const locale = LOCALES_SUPPORTEES.find(
      (supportee) =>
        normalized === supportee || normalized.startsWith(`${supportee}-`),
    );

    return locale === undefined ? null : new LocaleCode(locale);
  }

  static resolve(raw: unknown, fallback: SupportedLocale = 'fr'): LocaleCode {
    return LocaleCode.parse(raw) ?? new LocaleCode(fallback);
  }

  get value(): SupportedLocale {
    return this.normalizedValue;
  }
}
