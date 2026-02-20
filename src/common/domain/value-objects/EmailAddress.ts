export class EmailAddress {
  private constructor(private readonly normalizedValue: string) {}

  static parse(raw: unknown): EmailAddress | null {
    if (typeof raw !== 'string') return null;

    const value = raw.trim().toLowerCase();
    if (value.length === 0 || value.length > 320) return null;

    const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicEmailPattern.test(value)) return null;

    return new EmailAddress(value);
  }

  get value(): string {
    return this.normalizedValue;
  }
}
