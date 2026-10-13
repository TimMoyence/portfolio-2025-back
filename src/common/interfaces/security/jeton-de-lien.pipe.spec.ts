import { LienInvalideError } from '../../domain/errors/LienInvalideError';
import { JetonDeLienPipe } from './jeton-de-lien.pipe';

describe('JetonDeLienPipe', () => {
  const pipe = new JetonDeLienPipe();

  it('laisse passer un UUID v4', () => {
    expect(pipe.transform('550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it.each([
    ['un texte quelconque', 'pas-un-jeton'],
    ['un UUID v1', 'c232ab00-9414-11ec-b3c8-9f6bdeced846'],
    ['un UUID v4 en majuscules', '550E8400-E29B-41D4-A716-446655440000'],
    ['un en-tete repete', ['550e8400-e29b-41d4-a716-446655440000']],
    ['une valeur absente', undefined],
  ])('refuse comme un lien invalide %s', (_cas, valeur) => {
    expect(() => pipe.transform(valeur)).toThrow(LienInvalideError);
  });
});
