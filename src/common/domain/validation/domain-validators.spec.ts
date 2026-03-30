import { DomainValidationError } from '../errors/DomainValidationError';
import {
  requireText,
  optionalText,
  optionalMetadata,
} from './domain-validators';

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
    expect(optionalMetadata('  192.168.1.1  ')).toBe('192.168.1.1');
  });
});
