import {
  envBool,
  envBrut,
  envFloat,
  envInt,
  envListe,
  envPort,
  envPremier,
  envString,
  envUnVrai,
  estEnProduction,
} from './env-readers.util';
import {
  appliquer,
  installerVariables,
} from '../../test/helpers/environnement';

describe('estEnProduction', () => {
  it.each([
    ['production', true],
    [' production ', true],
    ['development', false],
    ['test', false],
    [undefined, false],
  ])('juge %p', (valeur, attendu) => {
    expect(estEnProduction({ NODE_ENV: valeur })).toBe(attendu);
  });
});

describe('envListe', () => {
  it('decoupe sur les virgules, nettoie chaque entree et retire les vides', () => {
    expect(envListe('CORS_ORIGIN', { CORS_ORIGIN: ' a, ,b,' })).toEqual([
      'a',
      'b',
    ]);
  });

  it.each([undefined, '', ' , '])('rend une liste vide pour %p', (valeur) => {
    expect(envListe('CORS_ORIGIN', { CORS_ORIGIN: valeur })).toEqual([]);
  });
});

describe('envPort', () => {
  const ALIAS = ['DB_PORT', 'DATABASE_PORT'] as const;

  it('lit le premier alias renseigne et le rend numerique', () => {
    expect(envPort(ALIAS, 'de test', { DATABASE_PORT: ' 5433 ' })).toBe(5433);
  });

  it('ne rend rien quand aucun alias n est renseigne', () => {
    expect(envPort(['DB_PORT'], 'de test', { DB_PORT: ' ' })).toBeUndefined();
  });

  it.each([
    'abc',
    '5433x',
    '-1',
    '54.3',
    '3000.0',
    '+3000',
    '5.87e2',
    '0x18EB',
    '0',
    '65536',
  ])(
    'refuse un port qui n est pas un entier de 1 a 65535 en chiffres seuls en nommant le service et ses alias (%p)',
    (port) => {
      expect(() => envPort(ALIAS, 'de test', { DB_PORT: port })).toThrow(
        `Le port de test « ${port} » n'est pas un entier de 1 a 65535 en chiffres seuls (DB_PORT, DATABASE_PORT).`,
      );
    },
  );

  it.each([
    ['1', 1],
    ['65535', 65535],
  ])('accepte la borne %p', (port, attendu) => {
    expect(envPort(ALIAS, 'de test', { DB_PORT: port })).toBe(attendu);
  });
});

describe('env-readers.util', () => {
  const KEY = 'BOOTSTRAP_DEBUG';
  const poser = (valeur: string): void => appliquer({ [KEY]: valeur });

  installerVariables({ [KEY]: undefined }, 'chaque-test');

  describe('envInt', () => {
    it('retourne le fallback si la variable est absente', () => {
      expect(envInt(KEY, 5)).toBe(5);
    });

    it('parse un entier valide', () => {
      poser('12');
      expect(envInt(KEY, 5)).toBe(12);
    });

    it('retourne le fallback pour une valeur non numerique', () => {
      poser('abc');
      expect(envInt(KEY, 5)).toBe(5);
    });
  });

  describe('envBool', () => {
    it('retourne le fallback si absent', () => {
      expect(envBool(KEY, true)).toBe(true);
    });

    it('reconnait "false"', () => {
      poser('false');
      expect(envBool(KEY, true)).toBe(false);
    });

    it('reconnait "true" (insensible a la casse)', () => {
      poser('TRUE');
      expect(envBool(KEY, false)).toBe(true);
    });
  });

  describe('envString', () => {
    it('trim la valeur', () => {
      poser('  hello  ');
      expect(envString(KEY)).toBe('hello');
    });

    it('retourne undefined pour une chaine vide ou blanche', () => {
      poser('   ');
      expect(envString(KEY)).toBeUndefined();
    });

    it('retourne undefined si absent', () => {
      expect(envString(KEY)).toBeUndefined();
    });
  });

  describe('source explicite', () => {
    it('lit la source fournie plutot que process.env', () => {
      poser('process');
      const source = { [KEY]: ' fournie ' };

      expect(envString(KEY, source)).toBe('fournie');
      expect(envInt(KEY, 1, { [KEY]: '7' })).toBe(7);
      expect(envBool(KEY, false, { [KEY]: 'True' })).toBe(true);
    });

    it('ignore une valeur qui n est pas une chaine', () => {
      expect(envString(KEY, { [KEY]: 42 })).toBeUndefined();
    });
  });

  describe('envPremier', () => {
    const HOTES = ['DB_HOST', 'DATABASE_HOST', 'PGHOST'] as const;

    it('rend la premiere variable renseignee parmi les alias', () => {
      expect(
        envPremier(HOTES, { DB_HOST: ' ', DATABASE_HOST: 'b', PGHOST: 'c' }),
      ).toBe('b');
    });

    it('rend undefined si aucun alias n est renseigne', () => {
      expect(envPremier(HOTES, {})).toBeUndefined();
    });

    it('lit chaque alias avec le lecteur fourni', () => {
      expect(
        envPremier(HOTES, { DB_HOST: '', DATABASE_HOST: ' b ' }, envBrut),
      ).toBe(' b ');
    });
  });

  describe('envBrut', () => {
    it('rend la valeur sans couper ses blancs', () => {
      expect(envBrut(KEY, { [KEY]: ' secret ' })).toBe(' secret ');
    });

    it.each(['', '   ', 42])('ignore la valeur %j', (valeur) => {
      expect(envBrut(KEY, { [KEY]: valeur })).toBeUndefined();
    });
  });

  describe('envUnVrai', () => {
    it('est vrai des qu un alias vaut true, quelle que soit sa place et sa casse', () => {
      expect(
        envUnVrai(['DB_SSL', 'DATABASE_SSL'], {
          DB_SSL: 'false',
          DATABASE_SSL: ' True ',
        }),
      ).toBe(true);
    });

    it('est faux quand aucun alias ne vaut true', () => {
      expect(
        envUnVrai(['DB_SSL', 'DATABASE_SSL'], {
          DB_SSL: 'false',
          DATABASE_SSL: '1',
        }),
      ).toBe(false);
      expect(envUnVrai(['DB_SSL'], {})).toBe(false);
    });
  });

  describe('envFloat', () => {
    it('parse un decimal', () => {
      poser('0.5');
      expect(envFloat(KEY, 1)).toBe(0.5);
    });

    it('retourne le fallback pour une valeur non numerique', () => {
      poser('NaN-like');
      expect(envFloat(KEY, 1.5)).toBe(1.5);
    });
  });
});
