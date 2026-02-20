import { LocaleCode } from './LocaleCode';

describe('LocaleCode', () => {
  it('parses locale variants to supported language code', () => {
    expect(LocaleCode.parse('fr')?.value).toBe('fr');
    expect(LocaleCode.parse('fr-FR')?.value).toBe('fr');
    expect(LocaleCode.parse('EN-us')?.value).toBe('en');
  });

  it('returns null for unsupported locale', () => {
    expect(LocaleCode.parse('es')).toBeNull();
    expect(LocaleCode.parse('')).toBeNull();
    expect(LocaleCode.parse(12)).toBeNull();
  });

  it('resolves fallback when input is invalid', () => {
    expect(LocaleCode.resolve('es').value).toBe('fr');
    expect(LocaleCode.resolve(null, 'en').value).toBe('en');
  });
});
