import { urlDuSite, urlPubliqueDeLApi } from './urls-publiques';

describe('urlDuSite', () => {
  it.each([
    ['absente', {}],
    ['vide', { FRONTEND_URL: '   ' }],
  ])('retombe sur asilidesign.fr quand FRONTEND_URL est %s', (_cas, env) => {
    expect(urlDuSite(env)).toBe('https://asilidesign.fr');
  });

  it('nettoie les blancs et les barres de fin de FRONTEND_URL', () => {
    expect(
      urlDuSite({ FRONTEND_URL: ' https://preprod.asilidesign.fr// ' }),
    ).toBe('https://preprod.asilidesign.fr');
  });
});

describe('urlPubliqueDeLApi', () => {
  it('place le chemin sous le préfixe de l API, à l adresse du site', () => {
    expect(urlPubliqueDeLApi('articles/feed.xml', {})).toBe(
      'https://asilidesign.fr/api/v1/portfolio25/articles/feed.xml',
    );
  });

  it('suit FRONTEND_URL et API_PREFIX', () => {
    expect(
      urlPubliqueDeLApi('/auth/', {
        FRONTEND_URL: 'https://preprod.asilidesign.fr/',
        API_PREFIX: '/api/',
      }),
    ).toBe('https://preprod.asilidesign.fr/api/auth');
  });

  it('ne laisse pas un préfixe hostile détourner l hôte', () => {
    expect(
      new URL(
        urlPubliqueDeLApi('articles/feed.xml', {
          API_PREFIX: '//evil.example',
        }),
      ).host,
    ).toBe('asilidesign.fr');
  });
});
