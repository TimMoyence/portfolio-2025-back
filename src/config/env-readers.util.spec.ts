import { envBool, envFloat, envInt, envString } from './env-readers.util';

describe('env-readers.util', () => {
  const KEY = 'ENV_READERS_TEST_KEY';

  afterEach(() => {
    delete process.env[KEY];
  });

  describe('envInt', () => {
    it('retourne le fallback si la variable est absente', () => {
      expect(envInt(KEY, 5)).toBe(5);
    });

    it('parse un entier valide', () => {
      process.env[KEY] = '12';
      expect(envInt(KEY, 5)).toBe(12);
    });

    it('retourne le fallback pour une valeur non numerique', () => {
      process.env[KEY] = 'abc';
      expect(envInt(KEY, 5)).toBe(5);
    });
  });

  describe('envBool', () => {
    it('retourne le fallback si absent', () => {
      expect(envBool(KEY, true)).toBe(true);
    });

    it('reconnait "false"', () => {
      process.env[KEY] = 'false';
      expect(envBool(KEY, true)).toBe(false);
    });

    it('reconnait "true" (insensible a la casse)', () => {
      process.env[KEY] = 'TRUE';
      expect(envBool(KEY, false)).toBe(true);
    });
  });

  describe('envString', () => {
    it('trim la valeur', () => {
      process.env[KEY] = '  hello  ';
      expect(envString(KEY)).toBe('hello');
    });

    it('retourne undefined pour une chaine vide ou blanche', () => {
      process.env[KEY] = '   ';
      expect(envString(KEY)).toBeUndefined();
    });

    it('retourne undefined si absent', () => {
      expect(envString(KEY)).toBeUndefined();
    });
  });

  describe('envFloat', () => {
    it('parse un decimal', () => {
      process.env[KEY] = '0.5';
      expect(envFloat(KEY, 1)).toBe(0.5);
    });

    it('retourne le fallback pour une valeur non numerique', () => {
      process.env[KEY] = 'NaN-like';
      expect(envFloat(KEY, 1.5)).toBe(1.5);
    });
  });
});
