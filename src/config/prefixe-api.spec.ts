import {
  cheminDeLApi,
  PREFIXE_API_PAR_DEFAUT,
  prefixeApi,
} from './prefixe-api';
import { installerVariables } from '../../test/helpers/environnement';

describe('prefixeApi', () => {
  it('rend le prefixe par defaut quand API_PREFIX est absent', () => {
    expect(prefixeApi({})).toBe(PREFIXE_API_PAR_DEFAUT);
    expect(PREFIXE_API_PAR_DEFAUT).toBe('api/v1/portfolio25');
  });

  it.each([
    ['sans barre', 'api/v1/portfolio25'],
    ['avec barre de tete', '/api/v1/portfolio25'],
    ['avec barre de queue', 'api/v1/portfolio25/'],
    ['avec les deux barres, comme en production', ' /api/v1/portfolio25/ '],
  ])('normalise un prefixe %s', (_cas, brut) => {
    expect(prefixeApi({ API_PREFIX: brut })).toBe('api/v1/portfolio25');
  });

  it('garde un prefixe vide comme une absence de prefixe', () => {
    expect(prefixeApi({ API_PREFIX: '' })).toBe('');
  });
});

describe('cheminDeLApi', () => {
  it('place le chemin sous le prefixe, sans double barre', () => {
    expect(
      cheminDeLApi('/newsletter/unsubscribe', { API_PREFIX: '/custom/' }),
    ).toBe('/custom/newsletter/unsubscribe');
  });

  it('ne rend qu une barre de tete sous un prefixe vide', () => {
    expect(cheminDeLApi('newsletter/confirm', { API_PREFIX: '' })).toBe(
      '/newsletter/confirm',
    );
  });

  describe('sans source explicite', () => {
    installerVariables({ API_PREFIX: 'api' }, 'chaque-test');

    it('lit process.env par defaut', () => {
      expect(cheminDeLApi('auth')).toBe('/api/auth');
    });
  });
});
