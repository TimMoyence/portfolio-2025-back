import { COURS_B2_07 } from './b2-07.cours';

const ECRANS_NOTES = [
  'B2-07-A1-01-ACCROCHE',
  'B2-07-A1-02-ENFANT-MULTIPLIER',
  'B2-07-A1-03-ENFANT-A-ET-K',
  'B2-07-A1-04-ENFANT-LN',
  'B2-07-A1-05-ENFANT-SEUIL',
  'B2-07-A1-07-ENFANT-BOUCLE',
  'B2-07-A1-08-ENFANT-TANT-QUE',
  'B2-07-A2-01-DOSSIER',
  'B2-07-A2-03-ENFANT-PENTE',
  'B2-07-A2-04-COURBE-PENTES',
  'B2-07-A2-05-COURS-DERIVEE',
  'B2-07-A2-06-EXEMPLE-DERIVEE',
  'B2-07-A2-07-ATELIER-DERIVEES',
  'B2-07-A2-08-VOTE-EXPONENTIELLE',
  'B2-07-A2-09-ENFANT-EXPONENTIELLE',
  'B2-07-A2-11-ATELIER-VENTES',
  'B2-07-A3-01-VOTE-SIGNE',
  'B2-07-A3-02-ENFANT-PANNEAU',
  'B2-07-A3-04-COURS-VARIATIONS',
  'B2-07-A3-05-EXEMPLE-VARIATIONS',
  'B2-07-A4-01-REFLEXION-CAPACITE',
  'B2-07-A4-02-ENFANT-SOMMET',
  'B2-07-A4-05-EXEMPLE-OPTIMUM',
  'B2-07-A4-06-ATELIER-PRIX',
  'B2-07-A4-07-TABLEUR-BENEFICE',
  'B2-07-A4-08-ATELIER-REVISIONS',
];

const noteDe = (screenId: string): string =>
  COURS_B2_07.ecrans.find((ecran) => ecran.screenId === screenId)?.notes ?? '';

describe('B2-07 — notes du formateur relues le 2026-11-19', () => {
  it('RET-09 · ne note que les écrans où la note apporte un oral, une histoire ou une relance', () => {
    expect(
      COURS_B2_07.ecrans
        .filter((ecran) => ecran.notes !== '')
        .map((ecran) => ecran.screenId),
    ).toEqual(ECRANS_NOTES);
  });

  it('RET-09 · raconte la querelle Newton-Leibniz sur l’accroche et le coût marginal sur l’exemple guidé', () => {
    expect(noteDe('B2-07-A1-01-ACCROCHE')).toContain('Royal Society');
    expect(noteDe('B2-07-A2-06-EXEMPLE-DERIVEE')).toBe(
      '• En gestion, K′ s’appelle le coût marginal : ce que coûte le mètre de plus. K′(2) = 3 l’annonce, et le vrai écart K(3) − K(2) = 38 − 34 = 4 € en est proche.',
    );
  });

  it('RET-09 · ne garde aucune transition ni consigne de déroulé', () => {
    expect(
      COURS_B2_07.ecrans.filter((ecran) =>
        /Transition|Réflexion :|S’arrêter|Annoncer|Faire dire|Question : «/u.test(
          ecran.notes,
        ),
      ),
    ).toEqual([]);
  });
});
