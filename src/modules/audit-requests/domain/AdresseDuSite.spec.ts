import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { adresseDuSite } from './AdresseDuSite';

describe('adresseDuSite', () => {
  it.each([
    ['example.com', 'https://example.com/'],
    ['  www.example.com  ', 'https://www.example.com/'],
    ['EXAMPLE.com', 'https://example.com/'],
    ['example.com:8080', 'https://example.com:8080/'],
    ['example.com?x', 'https://example.com/?x'],
    [
      'https://example.com/tarifs?ref=1#offre',
      'https://example.com/tarifs?ref=1',
    ],
    ['http://example.com', 'http://example.com/'],
  ])('lit %p comme l adresse %p', (saisie, attendue) => {
    expect(adresseDuSite(saisie).toString()).toBe(attendue);
  });

  it.each([
    [''],
    ['   '],
    ['localhost'],
    ['http://localhost:3000'],
    ['Example Studio'],
    ['exemple'],
    ['ftp://example.com'],
    ['https://user:pass@example.com'],
  ])('refuse %p, que le pipeline ne sait pas auditer', (saisie) => {
    expect(() => adresseDuSite(saisie)).toThrow(
      new DomainValidationError('Invalid audit website'),
    );
  });
});
