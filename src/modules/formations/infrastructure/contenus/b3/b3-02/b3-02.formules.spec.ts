import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import { COURS_B3_02 } from './b3-02.cours';

const REPERE = ' ✓ telle quelle';
const DEBUT_DE_FORMULE = /(?:^|\s)=[A-Z]/u;
const CELLULE_NOMMEE = /\b(?:[Ee]n [A-Z]{1,2}\d+|[Dd]ans une cellule vide)\b/u;

function consigneDe(screenId: string): string {
  const ecran = fiche.ecranDuContenu(COURS_B3_02, screenId);
  if (ecran.brique !== 'questionnaire') {
    throw new Error(`${screenId} n’est pas un exercice`);
  }
  return ecran.proprietes.consigne ?? '';
}

function raisonnementsDeLExempleGuide(): readonly string[] {
  const ecran = fiche.ecranDuContenu(
    COURS_B3_02,
    'B3-02-A1-12-EXEMPLE-RECHERCHE',
  );
  if (ecran.brique !== 'fp-worked') {
    throw new Error('l’exemple guidé a changé de brique');
  }
  return ecran.proprietes.exemple.etapes.map(
    ({ raisonnement }) => raisonnement,
  );
}

function formulesMalReperees(texte: string): readonly string[] {
  return texte.split('\n').flatMap((ligne) => {
    const morceaux = ligne.split(REPERE);
    const sansRepere = morceaux.at(-1) ?? '';
    const reperes = morceaux.slice(0, -1).filter((morceau) => {
      const debut = morceau.search(DEBUT_DE_FORMULE);
      return (
        debut === -1 ||
        !CELLULE_NOMMEE.test(morceau.slice(0, debut)) ||
        DEBUT_DE_FORMULE.test(morceau.slice(debut + 2))
      );
    });
    return [
      ...reperes,
      ...(DEBUT_DE_FORMULE.test(sansRepere) ? [sansRepere] : []),
    ];
  });
}

describe('B3-02 — les repères des formules', () => {
  it.each([
    'B3-02-A1-08-ATELIER-NETTOYAGE',
    'B3-02-A1-13-ATELIER-RECHERCHE',
    'B3-02-A2-05-ATELIER-DELAIS',
    'B3-02-A2-09-ATELIER-TCD',
    'B3-02-A2-17-ATELIER-DASHBOARD',
  ])(
    'B6 · repères des formules · %s nomme la cellule de chaque formule et la dit telle quelle',
    (screenId) => {
      const consigne = consigneDe(screenId);

      expect(consigne).toContain(REPERE);
      expect(formulesMalReperees(consigne)).toEqual([]);
    },
  );

  it('B6 · repères des formules · l’exemple guidé nomme la cellule de chaque formule et la dit telle quelle', () => {
    const raisonnements = raisonnementsDeLExempleGuide();

    expect(
      raisonnements.filter((texte) => texte.includes(REPERE)),
    ).toHaveLength(3);
    expect(raisonnements.flatMap(formulesMalReperees)).toEqual([]);
  });
});
