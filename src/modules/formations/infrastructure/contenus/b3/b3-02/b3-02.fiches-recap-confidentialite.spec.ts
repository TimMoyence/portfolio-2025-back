import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import { FICHES_RECAP_A4 } from './b3-02.briques';
import { COURS_B3_02 } from './b3-02.cours';

describe('B3-02 — la fiche récap 1, publique avant la séance', () => {
  const [{ imageAlt }] = FICHES_RECAP_A4;

  it('B7 · B302-M5 · illustre le signalement par une remise et un client vide, hors des anomalies du tri', () => {
    expect(imageAlt).toContain('=SI(OU(K2>0,5;D2="");"À vérifier";"OK")');
  });

  it('B7 · B302-M5 · ne range ni la quantité négative du rappel noté, ni la livraison antérieure du tri', () => {
    expect(imageAlt).toContain('Signaler');
    expect(imageAlt).not.toMatch(
      /−2|quantité négative|I2<=0|C2<B2|livr\S* avant/u,
    );
  });

  it.each(FICHES_RECAP_A4.map(({ titre, imageAlt: texte }) => [titre, texte]))(
    'B7 · B302-M5 · %s ne nomme aucune case de la grille du tri noté',
    (_titre, texte) => {
      const ecran = fiche.ecranDuContenu(
        COURS_B3_02,
        'B3-02-A1-03-TRI-ANOMALIES',
      );
      if (ecran.brique !== 'fp-cardsort') {
        throw new Error('B3-02-A1-03-TRI-ANOMALIES n’est plus un tri');
      }
      const cases = ecran.proprietes.plan.categories
        .flatMap(({ libelle }) => libelle.split(' · '))
        .filter((morceau) => morceau !== 'Faux')
        .map((morceau) => morceau.toLowerCase());

      expect(cases).toContain('suspect');
      expect(
        cases.filter((morceau) => texte.toLowerCase().includes(morceau)),
      ).toEqual([]);
    },
  );
});
