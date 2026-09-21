import * as fc from 'fast-check';
import { lireNombreSaisi } from './SaisieNumerique';

const ESPACES_SAISIS = [' ', ' ', ' ', ' '] as const;
const SUFFIXES_SAISIS = ['', '%', '€', 'pt', 'pts', 'point', 'points'] as const;
const DECIMALES_MAX = 4;
const BORNE = 1_000_000;

function decimal(): fc.Arbitrary<number> {
  return fc
    .tuple(
      fc.integer({ min: -BORNE, max: BORNE }),
      fc.integer({ min: 0, max: 10 ** DECIMALES_MAX - 1 }),
    )
    .map(([entier, fraction]) =>
      Number(`${entier}.${String(fraction).padStart(DECIMALES_MAX, '0')}`),
    );
}

function saisieDe(valeur: number, separateur: string): string {
  return separateur === ',' ? String(valeur).replace('.', ',') : String(valeur);
}

describe('lireNombreSaisi sur des saisies d etudiants', () => {
  it('rend le meme nombre quels que soient les espaces, la virgule et le suffixe', () => {
    fc.assert(
      fc.property(
        decimal(),
        fc.constantFrom(...ESPACES_SAISIS),
        fc.constantFrom(',', '.'),
        fc.constantFrom(...SUFFIXES_SAISIS),
        (valeur, espace, separateur, suffixe) => {
          const saisie = `${espace}${saisieDe(valeur, separateur)}${espace}${suffixe}`;
          expect(lireNombreSaisi(saisie)).toBeCloseTo(valeur, DECIMALES_MAX);
        },
      ),
    );
  });

  it('lit le moins typographique comme un moins', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: BORNE }), (valeur) => {
        expect(lireNombreSaisi(`−${String(valeur)}`)).toBe(-valeur);
      }),
    );
  });

  it('refuse toute saisie qui n est pas un nombre isole', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((texte) => /[a-z=+*/]/i.test(texte)),
        decimal(),
        (texte, valeur) => {
          expect(lireNombreSaisi(`${String(valeur)}${texte}x`)).toBeNull();
        },
      ),
    );
  });
});
