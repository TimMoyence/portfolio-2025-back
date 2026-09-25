import { DomainValidationError } from '../errors/DomainValidationError';
import {
  requireText,
  optionalText,
  optionalMetadata,
  requireHttpUrl,
  requireValidDate,
  optionalHttpUrl,
} from './domain-validators';

describe('requireHttpUrl', () => {
  it('rend l URL http ou https trimmee', () => {
    expect(requireHttpUrl('  https://example.com/a  ', 'lien')).toBe(
      'https://example.com/a',
    );
    expect(requireHttpUrl('http://example.com', 'lien')).toBe(
      'http://example.com',
    );
  });

  it.each([
    ['un non-string', 42],
    ['une chaine vide', '   '],
    ['une URL de plus de 1000 caracteres', `https://e.com/${'a'.repeat(1000)}`],
    ['une URL illisible', 'pas une url'],
    ['un protocole autre que http(s)', 'javascript:alert(1)'],
  ])('rejette %s', (_cas, valeur) => {
    expect(() => requireHttpUrl(valeur, 'lien')).toThrow(
      new DomainValidationError('Invalid lien'),
    );
  });
});

describe('optionalHttpUrl', () => {
  it('rend undefined quand le lien est absent ou vide', () => {
    expect(optionalHttpUrl(undefined, 'lien')).toBeUndefined();
    expect(optionalHttpUrl(null, 'lien')).toBeUndefined();
    expect(optionalHttpUrl('  ', 'lien')).toBeUndefined();
  });

  it('valide un lien present comme requireHttpUrl', () => {
    expect(optionalHttpUrl(' https://example.com ', 'lien')).toBe(
      'https://example.com',
    );
    expect(() => optionalHttpUrl('ftp://example.com', 'lien')).toThrow(
      DomainValidationError,
    );
  });
});

describe('requireText', () => {
  it('devrait retourner le texte trimme', () => {
    expect(requireText('  hello world  ', 'test', 2, 50)).toBe('hello world');
  });

  it('devrait rejeter une valeur non-string', () => {
    expect(() => requireText(42, 'test', 2, 50)).toThrow(DomainValidationError);
    expect(() => requireText(null, 'test', 2, 50)).toThrow(
      DomainValidationError,
    );
    expect(() => requireText(undefined, 'test', 2, 50)).toThrow(
      DomainValidationError,
    );
  });

  it('devrait rejeter un texte trop court', () => {
    expect(() => requireText('a', 'test', 2, 50)).toThrow(
      DomainValidationError,
    );
  });

  it('devrait rejeter un texte trop long', () => {
    expect(() => requireText('a'.repeat(51), 'test', 2, 50)).toThrow(
      DomainValidationError,
    );
  });
});

describe('optionalText', () => {
  it('devrait retourner undefined pour null/undefined', () => {
    expect(optionalText(null, 'test', 50)).toBeUndefined();
    expect(optionalText(undefined, 'test', 50)).toBeUndefined();
  });

  it('devrait retourner undefined pour une chaine vide', () => {
    expect(optionalText('', 'test', 50)).toBeUndefined();
    expect(optionalText('   ', 'test', 50)).toBeUndefined();
  });

  it('devrait retourner le texte trimme', () => {
    expect(optionalText('  hello  ', 'test', 50)).toBe('hello');
  });

  it('devrait rejeter un texte trop long', () => {
    expect(() => optionalText('a'.repeat(51), 'test', 50)).toThrow(
      DomainValidationError,
    );
  });

  it('devrait rejeter une valeur non-string (nombre)', () => {
    expect(() => optionalText(42, 'test', 50)).toThrow(DomainValidationError);
  });

  it('devrait rejeter une valeur non-string (boolean)', () => {
    expect(() => optionalText(true, 'test', 50)).toThrow(DomainValidationError);
  });
});

describe('optionalMetadata', () => {
  it('devrait retourner null pour null/undefined', () => {
    expect(optionalMetadata(null)).toBeNull();
    expect(optionalMetadata(undefined)).toBeNull();
  });

  it('devrait retourner null pour un non-string', () => {
    expect(optionalMetadata(42)).toBeNull();
  });

  it('devrait retourner null pour une chaine vide', () => {
    expect(optionalMetadata('')).toBeNull();
    expect(optionalMetadata('   ')).toBeNull();
  });

  it('devrait retourner le texte trimme', () => {
    expect(optionalMetadata('  203.0.113.7  ')).toBe('203.0.113.7');
  });
});

describe('requireValidDate', () => {
  it('devrait rendre une date valide telle quelle', () => {
    const date = new Date('2026-09-25T10:00:00Z');
    expect(requireValidDate(date, 'terms accepted')).toBe(date);
  });

  it.each([
    ['une date invalide', new Date('pas une date')],
    ['une chaine', '2026-09-25'],
    ['undefined', undefined],
  ])('devrait refuser %s en nommant le champ', (_label, valeur) => {
    expect(() => requireValidDate(valeur, 'terms accepted')).toThrow(
      new DomainValidationError('Invalid terms accepted date'),
    );
  });
});
