import {
  lienDeDesabonnement,
  urlDuSite,
  urlPubliqueDeLApi,
} from './urls-publiques';

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
});

describe('lienDeDesabonnement', () => {
  it('pointe le désabonnement de la newsletter avec le jeton en paramètre', () => {
    expect(lienDeDesabonnement('jeton-1', {})).toBe(
      'https://asilidesign.fr/api/v1/portfolio25/newsletter/unsubscribe?token=jeton-1',
    );
  });

  it('encode un jeton qui contiendrait des caractères réservés', () => {
    expect(lienDeDesabonnement('a&b=c d', { API_PREFIX: '' })).toBe(
      'https://asilidesign.fr/newsletter/unsubscribe?token=a%26b%3Dc+d',
    );
  });

  it('ne laisse pas un préfixe hostile détourner l hôte', () => {
    expect(
      new URL(lienDeDesabonnement('jeton', { API_PREFIX: '//evil.example' }))
        .host,
    ).toBe('asilidesign.fr');
  });
});
