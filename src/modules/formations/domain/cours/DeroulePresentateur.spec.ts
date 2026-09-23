import { buildCoursDeTest } from '../../../../../test/factories/cours.factory';
import {
  BRIQUES_STOCKEES,
  buildCoursDeBriques,
  buildEcranDeBrique,
} from '../../../../../test/factories/ecrans-stockes.factory';
import { CONFUSIONS } from './banque/confusions';
import { lireCoursStocke } from './CoursStocke';
import { deroulePresentateur, SEUIL_PAR_DEFAUT } from './DeroulePresentateur';
import type { CorrigePresentateur, EcranDeroule } from './DeroulePresentateur';
import { tirer } from './Tirage';

describe('deroulePresentateur', () => {
  const cours = buildCoursDeTest();
  const deroule = deroulePresentateur(cours, 424);
  const ecran = (id: string): EcranDeroule =>
    deroule.ecrans.find((candidat) => candidat.id === id)!;

  it('reprend le sujet du tirage de reference', () => {
    const sujet = tirer(cours, 424).sujet;
    expect(
      deroule.ecrans.map(({ id, type, titre, duree, interactif, donnees }) => ({
        id,
        type,
        titre,
        duree,
        interactif,
        donnees,
      })),
    ).toEqual(sujet.ecrans);
  });

  it('ajoute les notes, le seuil et le corrige de chaque ecran', () => {
    expect(ecran('E-OUV').notes).toBe('Rappel');
    expect(ecran('E-OUV').seuil).toBeCloseTo(0.6);
    expect(ecran('E-NUM').seuil).toBe(SEUIL_PAR_DEFAUT);
    expect(ecran('E-CITATION').seuil).toBeNull();
    expect(ecran('E-EXIT').seuil).toBeNull();
    expect(
      ecran('E-PRATIQUE').corriges.map((corrige) => corrige.questionId),
    ).toEqual(['Q-TEST-NUM-2', 'Q-TEST-NUM-3', 'Q-TEST-VOTE']);
    const corrigeAttendu: CorrigePresentateur = {
      questionId: 'Q-TEST-RAPPEL',
      bonneReponse: 'plus bas qu’au départ',
      confusions: [
        {
          id: 'hausse-baisse-symetriques',
          libelle: CONFUSIONS['hausse-baisse-symetriques'].libelle,
        },
        {
          id: 'raisonnement-additif',
          libelle: CONFUSIONS['raisonnement-additif'].libelle,
        },
      ],
    };
    expect(ecran('E-OUV').corriges[0]).toEqual(corrigeAttendu);
  });

  it('expose les remediations du cours', () => {
    expect(deroule.remediations).toEqual({
      'hausse-baisse-symetriques': 'E-REM',
      'raisonnement-additif': 'E-REM',
      'ecart-absolu-au-lieu-du-taux': 'E-REM',
    });
  });
});

describe('deroulePresentateur (corrigés au déroulé, B22)', () => {
  const cours = lireCoursStocke(
    buildCoursDeBriques(
      BRIQUES_STOCKEES.map((brique) => buildEcranDeBrique(brique)),
    ),
  );
  const deroule = deroulePresentateur(cours, 11);
  const ecran = (brique: string): EcranDeroule => {
    const trouve = deroule.ecrans.find((candidat) => candidat.type === brique);
    if (!trouve) throw new Error(`brique ${brique} absente du déroulé`);
    return trouve;
  };

  it('porte la diffusion et le titre de chaque écran', () => {
    expect(deroule.ecrans.every((e) => e.diffusion === 'seance')).toBe(true);
    expect(ecran('fp-quote').titre).toBe('Écran fp-quote');
  });

  it('corrige les productions, les énigmes, les défis et la révélation d un vote', () => {
    expect(ecran('fp-sheet').corrigeEcran).toEqual({
      type: 'feuille',
      attendus: [
        {
          reference: 'D2',
          formuleReference: '=(C2-B2)/B2',
          valeur: -0.178054,
          tolerance: { type: 'relative', valeur: 0.0001 },
          forme: 'references',
        },
        {
          reference: 'D3',
          formuleReference: '=(C3-B3)/B3',
          valeur: 0.095238,
          tolerance: { type: 'relative', valeur: 0.0001 },
          forme: { memeQue: 'D2' },
        },
      ],
      seuilReussite: 0.8,
    });
    expect(ecran('fp-table-build').corrigeEcran).toEqual({
      type: 'tableau',
      attendus: [
        { rang: 0, cle: 'prix', valeur: 21.6 },
        { rang: 1, cle: 'prix', valeur: 20.52 },
      ],
      tolerance: { type: 'absolue', valeur: 0.01 },
      seuilReussite: 0.75,
    });
    expect(ecran('fp-cardsort').corrigeEcran).toMatchObject({
      type: 'classement',
      attendus: [
        {
          carteId: 'ca-2025',
          categorieId: 'valeur',
          justification: 'montant en euros : « combien ? »',
        },
        expect.any(Object),
      ],
    });
    expect(ecran('fp-escape').corrigeEcran).toEqual({
      type: 'enigmes',
      enigmes: [
        { enigmeId: 'b2-01-a6-e1-mix', solution: '23,4', fragment: 'K7' },
      ],
      codeFinal: 'K7',
    });
    expect(ecran('fp-challenge').corrigeEcran).toMatchObject({
      type: 'defi',
      strategies: [
        { id: 'axe', fausse: false },
        { id: 'couleur', fausse: true },
      ],
    });
    expect(ecran('fp-vote').corrigeEcran).toMatchObject({
      type: 'revelation',
      titre: 'Pourquoi le prix ne revient pas à son point de départ',
    });
    expect(ecran('fp-quote').corrigeEcran).toBeNull();
  });

  it('liste chaque question de l écran avec son énoncé et ses options', () => {
    expect(ecran('fp-vote').questions.map((q) => q.id)).toEqual([
      'b2-01-a3-sac-v1',
      'b2-01-a3-remise-v2',
    ]);
    expect(ecran('fp-cardsort').questions).toEqual([
      {
        id: 'b2-01-a1-anatomie',
        enonce:
          'Classez chaque chiffre du tableau de bord selon ce qu’il exprime.',
        options: null,
      },
    ]);
    expect(ecran('fp-escape').questions[0]).toEqual({
      id: 'b2-01-a6-e1-mix',
      enonce: 'Quel est le taux de marge brute global ?',
      options: null,
    });
    const [rappel] = ecran('fp-spaced').questions;
    expect(rappel.enonce).toBe('Peut-on valider chaque écriture ?');
    expect(rappel.options?.map((option) => option.libelle).sort()).toEqual([
      'Non : deux erreurs se compensent',
      'Oui : le total concorde',
    ]);
    expect(ecran('fp-numeric').questions[0].options).toBeNull();
  });

  it('ne donne de corrigé tiré qu aux votes et aux questions numériques', () => {
    expect(ecran('fp-cardsort').corriges).toEqual([]);
    expect(ecran('fp-spaced').corriges.map((c) => c.questionId)).toEqual([
      'b2-01-r-compensation',
      'b2-01-r-points',
    ]);
    expect(ecran('questionnaire').corriges.map((c) => c.questionId)).toEqual([
      'b2-01-a2-evolution-marge',
      'b2-01-a2-part-marketplace',
    ]);
    expect(ecran('fp-recall').corriges[0].bonneReponse).toBe('+25 %');
  });
});
