import { join } from 'path';
import {
  litterauxDe,
  sourcesHorsProprietaire,
} from '../../../../test/helpers/source-tree';
import { estNonVerifiable, nonVerifiable } from './non-verifiable';

const MODULE_AUDIT = join(__dirname, '..');
const LOCALES = ['fr', 'en'] as const;
const MARQUEUR = /no[nt] v[eé]rifiable/i;

describe('nonVerifiable', () => {
  it.each([
    ['fr', 'Non verifiable'],
    ['en', 'Not verifiable'],
  ] as const)('rend en %s le marqueur %s', (locale, marqueur) => {
    expect(nonVerifiable(locale)).toBe(marqueur);
  });

  it('est le seul producteur et le seul lecteur du marqueur dans le module d audit', () => {
    const sources = sourcesHorsProprietaire(
      MODULE_AUDIT,
      join(__dirname, 'non-verifiable.ts'),
    );

    expect(sources).toContain(
      join(MODULE_AUDIT, 'infrastructure/automation/tech-fingerprint.util.ts'),
    );
    expect(
      sources
        .filter((fichier) =>
          litterauxDe(fichier).some((texte) => MARQUEUR.test(texte)),
        )
        .map((fichier) => fichier.slice(MODULE_AUDIT.length + 1)),
    ).toEqual([]);
  });
});

describe('estNonVerifiable', () => {
  it.each(LOCALES)(
    'reconnait le marqueur %s quelles que soient sa casse et sa place dans le texte',
    (locale) => {
      const marqueur = nonVerifiable(locale);

      expect(estNonVerifiable(marqueur)).toBe(true);
      expect(estNonVerifiable(marqueur.toUpperCase())).toBe(true);
      expect(estNonVerifiable(`Couverture : ${marqueur}.`)).toBe(true);
    },
  );

  it.each(['', 'Verifiable', 'WordPress', 'Pas de sitemap'])(
    'ne reconnait pas %j',
    (texte) => {
      expect(estNonVerifiable(texte)).toBe(false);
    },
  );
});
