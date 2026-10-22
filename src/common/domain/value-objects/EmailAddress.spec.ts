import { isEmail } from 'class-validator';
import { EmailAddress, MOTIF_D_UNE_ADRESSE_EMAIL } from './EmailAddress';

const INVISIBLE = /[\p{Cc}\p{Cf}\p{Z}\p{Co}\p{Cs}]/u;

describe('EmailAddress', () => {
  it('juge chaque caractère du plan de base comme isEmail, les invisibles en moins', () => {
    const ecarts: string[] = [];
    for (let point = 0x21; point <= 0xffff; point += 1) {
      const caractere = String.fromCharCode(point);
      for (const adresse of [
        `a${caractere}b@exemple.fr`,
        `jean@ex${caractere}mple.fr`,
        `jean@exemple.f${caractere}`,
      ]) {
        const attendu = !INVISIBLE.test(caractere) && isEmail(adresse);
        if (MOTIF_D_UNE_ADRESSE_EMAIL.test(adresse) !== attendu) {
          ecarts.push(`U+${point.toString(16).padStart(4, '0')} ${adresse}`);
        }
      }
    }

    expect(ecarts.slice(0, 20)).toEqual([]);
  });

  it('normalizes a valid email', () => {
    const parsed = EmailAddress.parse('  John.Doe+tag@Example.com  ');

    expect(parsed).not.toBeNull();
    expect(parsed?.value).toBe('john.doe+tag@example.com');
  });

  it('returns null for invalid emails', () => {
    expect(EmailAddress.parse('john.doe')).toBeNull();
    expect(EmailAddress.parse('john@doe')).toBeNull();
    expect(EmailAddress.parse(42)).toBeNull();
  });

  it('accepts a multi-label domain', () => {
    expect(EmailAddress.parse('john@mail.sub.example.co.uk')?.value).toBe(
      'john@mail.sub.example.co.uk',
    );
  });

  it.each(['john@example..com', 'john@.example.com', 'john@example.'])(
    'returns null when the domain has an empty label (%s)',
    (raw) => {
      expect(EmailAddress.parse(raw)).toBeNull();
    },
  );

  it('returns null when email exceeds max length', () => {
    const tooLong = `${'a'.repeat(315)}@x.com`;
    expect(tooLong.length).toBeGreaterThan(320);

    expect(EmailAddress.parse(tooLong)).toBeNull();
  });
});
