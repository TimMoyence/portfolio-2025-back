import { DomainValidationError } from '../errors/DomainValidationError';
import {
  requireText,
  optionalText,
  optionalMetadata,
  requireHttpUrl,
  requireValidDate,
  optionalHttpUrl,
  requireEmail,
  optionalPhone,
  requireBoolean,
  requireLocale,
} from './domain-validators';

describe('requireLocale', () => {
  it.each([['fr'], ['en']])('rend la locale supportee %s', (saisie) => {
    expect(requireLocale(saisie, 'newsletter locale')).toBe(saisie);
  });

  it.each([
    ['une langue non supportee', 'de'],
    ['une variante regionale', 'fr-FR'],
    ['une casse differente', 'EN'],
    ['des blancs autour', ' en '],
    ['une chaine vide', ''],
    ['un nombre', 42],
    ['undefined', undefined],
  ])('refuse %s en nommant le champ', (_cas, valeur) => {
    expect(() => requireLocale(valeur, 'newsletter locale')).toThrow(
      new DomainValidationError('Invalid newsletter locale'),
    );
  });
});

describe('optionalPhone', () => {
  it('rend null quand le telephone est absent ou vide', () => {
    expect(optionalPhone(undefined, 'contact phone number')).toBeNull();
    expect(optionalPhone(null, 'contact phone number')).toBeNull();
    expect(optionalPhone('   ', 'contact phone number')).toBeNull();
  });

  it('rend le numero normalise', () => {
    expect(optionalPhone(' 06 12 34 56 78 ', 'contact phone number')).toBe(
      '0612345678',
    );
    expect(optionalPhone('00 33 6 12 34 56 78', 'contact phone number')).toBe(
      '+33612345678',
    );
  });

  it.each([
    ['des lettres', 'abc'],
    ['moins de six chiffres', '12345'],
    ['un nombre', 612345678],
    ['un booleen', true],
  ])('refuse %s en nommant le champ', (_cas, valeur) => {
    expect(() => optionalPhone(valeur, 'contact phone number')).toThrow(
      new DomainValidationError('Invalid contact phone number'),
    );
  });
});

describe('requireBoolean', () => {
  it('rend le booleen tel quel', () => {
    expect(requireBoolean(true, 'terms flag')).toBe(true);
    expect(requireBoolean(false, 'terms flag')).toBe(false);
  });

  it.each([
    ['une chaine', 'true'],
    ['un nombre', 1],
    ['undefined', undefined],
    ['null', null],
  ])('refuse %s en nommant le champ', (_cas, valeur) => {
    expect(() => requireBoolean(valeur, 'terms flag')).toThrow(
      new DomainValidationError('Invalid terms flag'),
    );
  });
});

describe('requireEmail', () => {
  it('rend l adresse sans espaces et en minuscules', () => {
    expect(requireEmail('  Lea.Martin@Example.TEST ', 'contact email')).toBe(
      'lea.martin@example.test',
    );
  });

  it.each([
    ['un non-string', 42],
    ['une chaine vide', '   '],
    ['une adresse sans domaine', 'lea.martin'],
    ['une adresse a espace', '"lea martin"@example.test'],
    [
      'une adresse de plus de 320 caracteres',
      `${'a'.repeat(310)}@example.test`,
    ],
  ])('rejette %s', (_cas, valeur) => {
    expect(() => requireEmail(valeur, 'contact email')).toThrow(
      new DomainValidationError('Invalid contact email'),
    );
  });
});

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

  it('compte un emoji pour un caractere, comme une colonne varchar', () => {
    const emoji = String.fromCodePoint(0x1f600);

    expect(requireText(emoji.repeat(50), 'test', 2, 50)).toBe(emoji.repeat(50));
    expect(() => requireText(emoji.repeat(51), 'test', 2, 50)).toThrow(
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

  it('compte un emoji pour un caractere, comme une colonne varchar', () => {
    const emoji = String.fromCodePoint(0x1f600);

    expect(optionalText(emoji.repeat(50), 'test', 50)).toBe(emoji.repeat(50));
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
