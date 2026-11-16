import * as feuille from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import { ecranDuCours } from '../../../../../../../test/helpers/formations/cours/lecture-de-cours';
import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import { presentationDe } from '../../../../domain/cours/structure/Cours';
import { COURS_B3_02 } from './b3-02.cours';

const COURS = buildCoursDuContenu(COURS_B3_02);
const FICHES = [
  ['B3-02-A2-18-FICHE-RECAP-1', 1],
  ['B3-02-A2-19-FICHE-RECAP-2', 2],
] as const;

describe('B3-02 — les fiches récap, vraies fiches A4', () => {
  it.each(FICHES)(
    'B7 · %s montre la fiche A4 en image, décrite par son texte alternatif',
    (screenId, rang) => {
      const ecran = COURS_B3_02.ecrans.find(
        (candidat) => candidat.screenId === screenId,
      );
      const { image, imageAlt } = feuille.proprietesV2(
        COURS_B3_02,
        screenId,
      ) as { image: string; imageAlt: string };

      expect(ecran && presentationDe(ecran)?.renderer).toBe('illustration');
      expect(image).toBe(`/assets/cours/b3-02/v1/fiche-recap-${rang}.webp`);
      expect(imageAlt).toMatch(new RegExp(`^Fiche récap ${rang} sur 2`, 'u'));
    },
  );

  it.each(FICHES)(
    'B7 · %s offre son PDF public à télécharger, sans bouton d’impression',
    (screenId, rang) => {
      expect(ecranDuCours(COURS, screenId).pieceJointe).toEqual({
        libelle: `Fiche récap ${rang} (PDF)`,
        fichier: expect.stringMatching(
          new RegExp(
            `^/assets/cours/b3-02/b3-02-fiche-recap-${rang}\\.[0-9a-f]{8}\\.pdf$`,
            'u',
          ),
        ),
      });
      expect(feuille.proprietesV2(COURS_B3_02, screenId)).not.toHaveProperty(
        'imprimable',
      );
    },
  );

  it('B7 · déclare les deux images A4 au catalogue des médias du cours', () => {
    expect(
      (COURS_B3_02.medias ?? [])
        .flatMap(({ chemins }) => chemins)
        .filter((chemin) => chemin.includes('fiche-recap')),
    ).toEqual([
      '/assets/cours/b3-02/v1/fiche-recap-1.webp',
      '/assets/cours/b3-02/v1/fiche-recap-2.webp',
    ]);
  });
});
