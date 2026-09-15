import {
  buildCoursDeTest,
  QUESTION_NUMERIQUE_TEST,
  QUESTION_VOTE_TEST,
} from '../../../../../test/factories/cours.factory';
import { creerRng, creerTirage } from './Aleatoire';
import type { Cours, Ecran } from './Cours';
import {
  estInteractif,
  questionNumerique,
  questionsDuCours,
  questionVote,
} from './Cours';

describe('questionNumerique', () => {
  it('genere enonce, solution et pieges depuis les memes donnees', () => {
    const tiree = QUESTION_NUMERIQUE_TEST.generer(creerTirage(creerRng(4)));
    const depart = Number(/de (\d+) €/.exec(tiree.enonce)?.[1]);
    const hausse = Number(/de (\d+) %/.exec(tiree.enonce)?.[1]);
    expect(tiree.solution).toBeCloseTo(depart * (1 + hausse / 100), 10);
    expect(tiree.pieges).toEqual([
      {
        confusion: 'ecart-absolu-au-lieu-du-taux',
        valeur: (depart * hausse) / 100,
      },
    ]);
  });

  it('expose les confusions de ses pieges', () => {
    expect(QUESTION_NUMERIQUE_TEST.confusions).toEqual([
      'ecart-absolu-au-lieu-du-taux',
    ]);
  });
});

describe('questionVote', () => {
  it('genere la bonne option et une option par piege', () => {
    const tiree = QUESTION_VOTE_TEST.generer(creerTirage(creerRng(1)));
    expect(tiree.bonne).toBe('plus bas qu’au départ');
    expect(tiree.pieges.map((piege) => piege.confusion)).toEqual([
      'hausse-baisse-symetriques',
      'raisonnement-additif',
    ]);
  });
});

describe('estInteractif', () => {
  it('deduit l interactivite de la brique', () => {
    const cours = buildCoursDeTest();
    expect(cours.ecrans.map((ecran) => estInteractif(ecran))).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
      true,
    ]);
  });
});

describe('questionsDuCours', () => {
  it('liste les questions dans l ordre du cours', () => {
    expect(
      questionsDuCours(buildCoursDeTest()).map((question) => question.id),
    ).toEqual([
      'Q-TEST-RAPPEL',
      'Q-TEST-NUM',
      'Q-TEST-NUM-2',
      'Q-TEST-NUM-3',
      'Q-TEST-VOTE',
      'Q-TEST-EXIT',
    ]);
  });
});

describe('contraintes portees par le type', () => {
  it('refuse a la compilation un concept, une confusion, une tolerance ou une brique hors contrat', () => {
    const base = {
      id: 'Q',
      noteCompte: false,
      donnees: () => ({}),
      enonce: () => 'e',
      unite: null,
      solution: () => 1,
    };
    questionNumerique({
      ...base,
      // @ts-expect-error concept absent de la banque
      concept: 'inconnu',
      tolerance: { type: 'absolue', valeur: 0 },
      pieges: [{ confusion: 'base-arrivee', valeur: () => 2 }],
    });
    questionNumerique({
      ...base,
      concept: 'proportion',
      tolerance: { type: 'absolue', valeur: 0 },
      // @ts-expect-error confusion absente de la banque
      pieges: [{ confusion: 'inconnue', valeur: () => 2 }],
    });
    // @ts-expect-error tolerance obligatoire
    questionNumerique({
      ...base,
      concept: 'proportion',
      pieges: [{ confusion: 'base-arrivee', valeur: () => 2 }],
    });
    questionVote({
      id: 'V',
      noteCompte: false,
      donnees: () => ({}),
      enonce: () => 'e',
      concept: 'proportion',
      bonne: () => 'b',
      // @ts-expect-error au moins un piege
      pieges: [],
    });
    const classement: Ecran = {
      id: 'E',
      // @ts-expect-error aucun palmares nominatif : la brique classement n existe pas
      brique: 'classement',
      dureeMinutes: 1,
      concepts: ['proportion'],
      notes: '',
    };
    const cours: Cours = buildCoursDeTest();
    expect([classement, cours]).toHaveLength(2);
  });
});
