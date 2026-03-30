/** Value Object immutable representant un numero de telephone normalise. */
export class PhoneNumber {
  private constructor(private readonly normalizedValue: string) {}

  static parse(raw: unknown): PhoneNumber | null {
    if (typeof raw !== 'string') return null;

    const trimmed = raw.trim();
    if (trimmed.length === 0) return null;

    // Keep parsing rules intentionally permissive for user-facing forms.
    if (!/^[0-9+\s().-]+$/.test(trimmed)) return null;

    const compact = trimmed.replace(/[\s().-]/g, '');
    if (compact.length === 0) return null;

    const withIntlPrefix = compact.startsWith('00')
      ? `+${compact.slice(2)}`
      : compact;
    const normalized = withIntlPrefix.startsWith('+')
      ? withIntlPrefix
      : withIntlPrefix.replace(/^\+/, '');
    const digits = normalized.replace(/^\+/, '');

    if (!/^\d+$/.test(digits)) return null;
    if (digits.length < 6 || digits.length > 15) return null;

    return new PhoneNumber(normalized);
  }

  get value(): string {
    return this.normalizedValue;
  }
}
