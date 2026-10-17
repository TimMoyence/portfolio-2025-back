import { isEmail } from 'class-validator';

const CARACTERE_INVISIBLE = /[\p{C}\p{Z}]/u;

export function estUneAdresseEmail(valeur: string): boolean {
  return (
    !CARACTERE_INVISIBLE.test(valeur) &&
    isEmail(valeur, { blacklisted_chars: '"' })
  );
}

export class EmailAddress {
  private constructor(private readonly normalizedValue: string) {}

  static parse(raw: unknown): EmailAddress | null {
    if (typeof raw !== 'string') return null;

    const value = raw.trim().toLowerCase();
    if (!estUneAdresseEmail(value)) return null;

    return new EmailAddress(value);
  }

  get value(): string {
    return this.normalizedValue;
  }
}
