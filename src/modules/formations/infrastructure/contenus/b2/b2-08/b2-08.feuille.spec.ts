import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import { projeterCatalogue } from '../../../../domain/cours/diffusion/Diffusion';
import { COURS_B2_08 } from './b2-08.cours';

const COURS = buildCoursDuContenu(COURS_B2_08);

const sansEspaces = (texte: string): string => texte.replaceAll(/\s/gu, '');

describe('B2-08 — la formule notée de la feuille de balayage reste en séance', () => {
  it('CONF-01 · ne sert au catalogue aucune formule attendue de la feuille notée', () => {
    const formules = fiche
      .corrigeDeFeuille(COURS, 'b2-08-a4-tableur-balayage')
      .attendus.map((attendu) => sansEspaces(attendu.formuleReference));
    const catalogue = projeterCatalogue(COURS)
      .ecrans.filter((ecran) => ecran.type !== 'ecran-verrouille')
      .map((ecran) => ({
        id: ecran.id,
        texte: sansEspaces(JSON.stringify(ecran)),
      }));

    expect(formules).toContain('=3000/(1+29*EXP(-0,5*A2))');
    expect(
      catalogue.flatMap(({ id, texte }) =>
        formules
          .filter((formule) => texte.includes(formule))
          .map((formule) => `${formule} dans ${id}`),
      ),
    ).toEqual([]);
  });
});
