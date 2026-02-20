import { PhoneNumber } from './PhoneNumber';

describe('PhoneNumber', () => {
  it('normalizes phone numbers with international 00 prefix', () => {
    const parsed = PhoneNumber.parse('00 33 (0)1 23 45 67 89');

    expect(parsed).not.toBeNull();
    expect(parsed?.value).toBe('+330123456789');
  });

  it('keeps plain digit local numbers when valid', () => {
    const parsed = PhoneNumber.parse('01 23 45 67 89');

    expect(parsed).not.toBeNull();
    expect(parsed?.value).toBe('0123456789');
  });

  it('returns null for invalid inputs', () => {
    expect(PhoneNumber.parse('abc')).toBeNull();
    expect(PhoneNumber.parse('12')).toBeNull();
    expect(PhoneNumber.parse(`+${'1'.repeat(16)}`)).toBeNull();
    expect(PhoneNumber.parse({})).toBeNull();
  });
});
