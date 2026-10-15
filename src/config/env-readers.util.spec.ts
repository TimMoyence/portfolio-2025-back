import {
  envBool,
  envBrut,
  envEntierBorne,
  envFloat,
  envInt,
  envPort,
  envPremier,
  envString,
  envUnVrai,
} from './env-readers.util';
import {
  appliquer,
  installerVariables,
} from '../../test/helpers/environnement';

describe('envPort', () => {
  it('lit le premier alias renseigne et le rend numerique', () => {
    expect(envPort(['A_PORT', 'B_PORT'], 'de test', { B_PORT: ' 5433 ' })).toBe(
      5433,
    );
  });

  it('ne rend rien quand aucun alias n est renseigne', () => {
    expect(envPort(['A_PORT'], 'de test', { A_PORT: ' ' })).toBeUndefined();
  });

  it.each(['abc', '5433x', '-1', '54.3'])(
    'refuse un port qui n est pas un entier positif en nommant le service et ses alias (%p)',
    (port) => {
      expect(() =>
        envPort(['A_PORT', 'B_PORT'], 'de test', { A_PORT: port }),
      ).toThrow(
        `Le port de test « ${port} » n'est pas un entier positif (A_PORT, B_PORT).`,
      );
    },
  );
});

describe('env-readers.util', () => {
  const KEY = 'ENV_READERS_TEST_KEY';
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
    it('rend la premiere variable renseignee parmi les alias', () => {
      expect(envPremier(['A', 'B', 'C'], { A: ' ', B: 'b', C: 'c' })).toBe('b');
    });

    it('rend undefined si aucun alias n est renseigne', () => {
      expect(envPremier(['A', 'B'], {})).toBeUndefined();
    });

    it('lit chaque alias avec le lecteur fourni', () => {
      expect(envPremier(['A', 'B'], { A: '', B: ' b ' }, envBrut)).toBe(' b ');
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

  describe('envEntierBorne', () => {
    const bornes = { defaut: 90, min: 0, max: 1440 };

    it.each([
      ['absente', undefined, 90],
      ['vide', '  ', 90],
      ['entière dans les bornes', ' 120 ', 120],
      ['au plancher', '0', 0],
      ['au plafond', '1440', 1440],
      ['sous le plancher', '-1', 90],
      ['au-dessus du plafond', '1441', 90],
      ['décimale', '1.5', 90],
      ['non numérique', '12abc', 90],
    ])(
      'rend le défaut ou la valeur quand elle est %s',
      (_cas, brut, attendu) => {
        expect(envEntierBorne(KEY, bornes, { [KEY]: brut })).toBe(attendu);
      },
    );
  });

  describe('envUnVrai', () => {
    it('est vrai des qu un alias vaut true, quelle que soit sa place et sa casse', () => {
      expect(envUnVrai(['A', 'B'], { A: 'false', B: ' True ' })).toBe(true);
    });

    it('est faux quand aucun alias ne vaut true', () => {
      expect(envUnVrai(['A', 'B'], { A: 'false', B: '1' })).toBe(false);
      expect(envUnVrai(['A'], {})).toBe(false);
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
