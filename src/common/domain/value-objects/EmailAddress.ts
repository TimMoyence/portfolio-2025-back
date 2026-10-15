import { isEmail } from 'class-validator';

export const REGLE_D_UNE_ADRESSE_EMAIL = { blacklisted_chars: '"' };

export class EmailAddress {
  private constructor(private readonly normalizedValue: string) {}

  static parse(raw: unknown): EmailAddress | null {
    if (typeof raw !== 'string') return null;

    const value = raw.trim().toLowerCase();
    if (!isEmail(value, REGLE_D_UNE_ADRESSE_EMAIL)) return null;

    return new EmailAddress(value);
  }

  get value(): string {
    return this.normalizedValue;
  }
}
