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

  it('returns null when email exceeds max length', () => {
    const tooLong = `${'a'.repeat(315)}@x.com`;
    expect(tooLong.length).toBeGreaterThan(320);

    expect(EmailAddress.parse(tooLong)).toBeNull();
  });
});
