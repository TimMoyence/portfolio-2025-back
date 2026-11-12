import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import { texteDeLImage } from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import {
  CORRESPONDANCE,
  solutionsDansLesTextes,
} from '../../../../../../../test/helpers/formations/cours/relecture-de-cours';
import { COURS_B3_02 } from './b3-02.cours';
import { PAGES_DE_FORMULES } from './b3-02.briques';

const CORRESPONDANCES_PAR_PAGE = 3;
const CARACTERES_D_UNE_LIGNE = 55;

const pages = COURS_B3_02.ecrans
  .filter(
    ({ screenId }) =>
      /-(FORMULES?|OUTIL)-/u.test(screenId) && !screenId.includes('RECAP'),
  )
  .map(({ screenId }) => ({
    id: screenId,
    ...texteDeLImage(COURS_B3_02, screenId),
  }));

describe('B3-02 — chaque page de formules met son infographie en face d’Excel', () => {
  it('IMG-4 · sert 3 correspondances d’une ligne infographie → Excel à la place des arguments', () => {
    expect(pages).toHaveLength(PAGES_DE_FORMULES);
    expect(
      pages
        .filter(
          ({ paragraphes, correspondances }) =>
            paragraphes.some((paragraphe) =>
              paragraphe.startsWith('Arguments'),
            ) ||
            correspondances.length !== CORRESPONDANCES_PAR_PAGE ||
            !correspondances.every(
              (ligne) =>
                CORRESPONDANCE.test(ligne) &&
                ligne.length <= CARACTERES_D_UNE_LIGNE,
            ),
        )
        .map(({ id }) => id),
    ).toEqual([]);
  });

  it('IMG-6 · n’écrit dans aucune correspondance la solution d’une question numérique du cours', () => {
    const cours = buildCoursDuContenu(COURS_B3_02);

    expect(
      pages.flatMap(({ id, correspondances }) =>
        solutionsDansLesTextes(cours, correspondances).map(
          (solution) => `${solution} dans ${id}`,
        ),
      ),
    ).toEqual([]);
  });
});
