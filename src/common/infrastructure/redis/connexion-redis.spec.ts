import {
  delaiDeReconnexionRedis,
  journalDErreursRedis,
  optionsRedis,
  resoudreConnexionRedis,
} from './connexion-redis';

describe('resoudreConnexionRedis', () => {
  it('ne rend aucune connexion sans REDIS_URL ni REDIS_HOST', () => {
    expect(resoudreConnexionRedis({ REDIS_PORT: '6379' })).toBeUndefined();
    expect(
      resoudreConnexionRedis({ REDIS_URL: ' ', REDIS_HOST: '' }),
    ).toBeUndefined();
  });

  it('se connecte a REDIS_HOST sur le port 6379 quand REDIS_PORT manque', () => {
    expect(resoudreConnexionRedis({ REDIS_HOST: 'cache' })).toEqual({
      host: 'cache',
      port: 6379,
    });
  });

  it('lit l hote, le port et les identifiants declares, sans leurs blancs', () => {
    expect(
      resoudreConnexionRedis({
        REDIS_HOST: 'cache',
        REDIS_PORT: '6380',
        REDIS_USERNAME: ' app ',
        REDIS_PASSWORD: 'secret ',
      }),
    ).toEqual({
      host: 'cache',
      port: 6380,
      username: 'app',
      password: 'secret',
    });
  });

  it('lit REDIS_URL avant REDIS_HOST, identifiants decodes et base comprise', () => {
    expect(
      resoudreConnexionRedis({
        REDIS_URL: 'redis://app:p%40ss@cache:6380/2',
        REDIS_HOST: 'ignore',
      }),
    ).toEqual({
      host: 'cache',
      port: 6380,
      username: 'app',
      password: 'p@ss',
      db: 2,
    });
  });

  it('active TLS pour rediss et prend le port 6379 par defaut', () => {
    expect(resoudreConnexionRedis({ REDIS_URL: 'rediss://:pw@cache' })).toEqual(
      { host: 'cache', port: 6379, password: 'pw', tls: {} },
    );
  });

  it('retire les crochets d un hote IPv6', () => {
    expect(
      resoudreConnexionRedis({ REDIS_URL: 'redis://[::1]:6379' })?.host,
    ).toBe('::1');
  });

  it('refuse au demarrage une REDIS_URL illisible sans recopier son secret', () => {
    const lire = () =>
      resoudreConnexionRedis({ REDIS_URL: 'pas une url motdepasse' });

    expect(lire).toThrow(/REDIS_URL/);
    expect(lire).not.toThrow(/motdepasse/);
  });

  it.each(['abc', '63 79', '-1'])(
    'refuse au demarrage un REDIS_PORT qui n est pas un entier positif (%p)',
    (port) => {
      expect(() =>
        resoudreConnexionRedis({ REDIS_HOST: 'cache', REDIS_PORT: port }),
      ).toThrow(/port Redis/);
    },
  );
});

describe('delaiDeReconnexionRedis', () => {
  it.each([
    [1, 500],
    [2, 1000],
    [3, 1500],
    [4, null],
  ])('attend %p fois 500 ms puis abandonne apres trois essais', (n, delai) => {
    expect(delaiDeReconnexionRedis(n)).toBe(delai);
  });
});

describe('optionsRedis', () => {
  it('ajoute les reglages du client et la strategie de reconnexion commune', () => {
    const options = optionsRedis(
      { host: 'cache', port: 6379 },
      { maxRetriesPerRequest: null },
    );

    expect(options).toEqual({
      host: 'cache',
      port: 6379,
      maxRetriesPerRequest: null,
      retryStrategy: delaiDeReconnexionRedis,
    });
  });
});

describe('journalDErreursRedis', () => {
  it('ne signale que les trois premieres erreurs et previent une fois au plafond', () => {
    const avertir = jest.fn();
    const auPlafond = jest.fn();
    const signaler = journalDErreursRedis({
      libelle: 'File Redis',
      avertir,
      auPlafond,
    });

    for (const erreur of ['e1', 'e2', 'e3', 'e4']) {
      signaler(new Error(erreur));
    }

    expect(avertir.mock.calls).toEqual([
      ['File Redis: Error: e1'],
      ['File Redis: Error: e2'],
      ['File Redis: Error: e3'],
    ]);
    expect(auPlafond).toHaveBeenCalledTimes(1);
  });
});
