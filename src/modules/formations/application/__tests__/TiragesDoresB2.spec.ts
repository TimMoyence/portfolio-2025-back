import {
  baremeFige,
  contenusPublies,
  ecrirePortraitsDores,
  GRAINES_DOREES,
  portraitCourant,
  portraitDuBareme,
  portraitDuTirage,
  portraitsDores,
  solutionsDuBareme,
  type PortraitDore,
} from '../../../../../test/helpers/portrait-tirages-b2';
import { solutionFor } from '../../domain/Bareme';

const SLUG_B2 = 'b2-01-traitement-information-chiffree';
const CONTENUS = contenusPublies();

function doreDe(version: number): PortraitDore {
  const dore = portraitsDores().find(
    (portrait) => portrait.version === version,
  );
  if (dore === undefined) {
    throw new Error(`Aucun portrait doré pour la version ${version}`);
  }
  return dore;
}

describe('tirages dorés des versions publiées du B2 (R17)', () => {
  beforeAll(async () => {
    if (process.env.ECRIRE_TIRAGES_DORES === '1') {
      ecrirePortraitsDores(await Promise.all(CONTENUS.map(portraitCourant)));
    }
  });

  it('fige les deux versions publiées du B2, de 72 écrans chacune', () => {
    expect(
      CONTENUS.map((contenu) => [
        contenu.slug,
        contenu.version,
        contenu.ecrans.length,
      ]),
    ).toEqual([
      [SLUG_B2, 1, 72],
      [SLUG_B2, 2, 72],
    ]);
    expect(portraitsDores().map((portrait) => portrait.version)).toEqual([
      1, 2,
    ]);
  });

  it.each(CONTENUS.map((contenu) => [contenu.version, contenu] as const))(
    'v%i : ouvrirTirages rend le barème figé, graines et solutions comprises',
    (version, contenu) => {
      const dore = doreDe(version);

      expect(portraitDuBareme(contenu)).toEqual(dore.bareme);
      for (const solutions of solutionsDuBareme(contenu)) {
        expect(solutions).toEqual(dore.tirage.solutions);
      }
    },
  );

  it.each(
    CONTENUS.flatMap((contenu) =>
      GRAINES_DOREES.map(
        (graine) => [contenu.version, graine, contenu] as const,
      ),
    ),
  )(
    'v%i, graine %i : tirer, le déroulé et LireSujet rendent les sorties figées sur le barème figé',
    async (version, graine, contenu) => {
      const dore = doreDe(version);
      const bareme = baremeFige(dore.bareme, dore.tirage.solutions);

      await expect(portraitDuTirage(contenu, bareme, graine)).resolves.toEqual(
        dore.tirage,
      );
      for (const [questionId, solution] of Object.entries(
        dore.tirage.solutions,
      )) {
        expect(solutionFor(bareme, graine, questionId)).toEqual(solution);
      }
    },
  );
});
