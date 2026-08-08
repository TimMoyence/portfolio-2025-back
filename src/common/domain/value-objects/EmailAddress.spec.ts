import { EmailAddress } from './EmailAddress';

describe('EmailAddress', () => {
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
