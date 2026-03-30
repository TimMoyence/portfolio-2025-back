export type SupportedLocale = 'fr' | 'en';

/** Value Object immutable representant un code de langue supporte (fr ou en). */
export class LocaleCode {
  private constructor(private readonly normalizedValue: SupportedLocale) {}

  static parse(raw: unknown): LocaleCode | null {
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim().toLowerCase();
    if (normalized === 'fr' || normalized.startsWith('fr-')) {
      return new LocaleCode('fr');
    }
    if (normalized === 'en' || normalized.startsWith('en-')) {
      return new LocaleCode('en');
    }

    return null;
  }

  static resolve(raw: unknown, fallback: SupportedLocale = 'fr'): LocaleCode {
    return LocaleCode.parse(raw) ?? new LocaleCode(fallback);
  }

  get value(): SupportedLocale {
    return this.normalizedValue;
  }
}
