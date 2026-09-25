import {
  buildCoursDeTest,
  EN_CATALOGUE,
  QUESTION_NUMERIQUE_TEST,
  QUESTION_VOTE_TEST,
  SOCLE_DE_QUESTION_FIGEE,
} from '../../../../../test/factories/cours.factory';
import {
  buildEcranStocke,
  buildCoursStocke,
} from '../../../../../test/factories/cours-stocke.factory';
import {
  BRIQUES_STOCKEES,
  buildCasAQuestionsLibres,
  buildCoursDeBriques,
  buildEcranDeBrique,
} from '../../../../../test/factories/ecrans-stockes.factory';
import type { Cours, Ecran } from '../contrats/cours';
import { creerRng, creerTirage } from './Aleatoire';
import {
  estInteractif,
  questionNumerique,
  questionsDe,
  questionsDuCours,
  questionVote,
} from './Cours';
import { lireCoursStocke } from './CoursStocke';

const EXPOSITIONS = [
  'fp-quote',
  'fp-pro',
  'fp-concept4',
  'fp-plot',
  'fp-pulse',
];

function ecranV3(brique: string): Ecran {
  return lireCoursStocke(buildCoursDeBriques([buildEcranDeBrique(brique)]))
    .ecrans[0];
}

function recitDeRendu(renderer: string, props: Record<string, unknown>) {
  return lireCoursStocke(
    buildCoursStocke({
      ecrans: [
        buildEcranStocke({
          proprietes: {
            presentation: {
              version: 2,
              screenId: 'B2-01-S03-PREDICTION',
              renderer,
              props,
            },
          },
        }),
      ],
    }),
  ).ecrans[0];
}

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

describe('estInteractif (§ 2.6.1)', () => {
  it('deduit l interactivite de la brique', () => {
    const cours = buildCoursDeTest();
    expect(cours.ecrans.map((ecran) => estInteractif(ecran))).toEqual([
      true,
      false,
      true,
      false,
      true,
      true,
      true,
    ]);
  });

  it.each(BRIQUES_STOCKEES)(
    'compte %s comme interactif si et seulement s il recueille une production',
    (brique) => {
      expect(estInteractif(ecranV3(brique))).toBe(
        !EXPOSITIONS.includes(brique) && brique !== 'fp-story',
      );
    },
  );

  it('compte un récit comme interactif s il porte un quiz ou une réflexion v2', () => {
    expect(estInteractif(lireCoursStocke(buildCoursStocke()).ecrans[0])).toBe(
      true,
    );
    expect(
      estInteractif(
        recitDeRendu('reflection', {
          promptData: {
            id: 'reflexion',
            type: 'reflection',
            question: 'Que demander ?',
          },
        }),
      ),
    ).toBe(true);
    expect(
      estInteractif(
        recitDeRendu('stats', {
          title: 'Repères',
          stats: [{ value: '27,6 %', label: 'Taux' }],
        }),
      ),
    ).toBe(false);
  });

  it('L3 · compte un cas professionnel comme interactif quand il pose des questions libres', () => {
    const ecran = lireCoursStocke(
      buildCoursDeBriques([buildCasAQuestionsLibres()]),
    ).ecrans[0];

    expect(estInteractif(ecran)).toBe(true);
  });
});

describe('questionsDe', () => {
  it('liste la jumelle, les productions, les énigmes et la banque de rappel', () => {
    const identifiants = (brique: string) =>
      questionsDe(ecranV3(brique)).map((question) => question.id);

    expect(identifiants('fp-vote')).toEqual([
      'b2-01-a3-sac-v1',
      'b2-01-a3-remise-v2',
    ]);
    expect(identifiants('fp-cardsort')).toEqual(['b2-01-a1-anatomie']);
    expect(identifiants('fp-escape')).toEqual(['b2-01-a6-e1-mix']);
    expect(identifiants('fp-spaced')).toEqual([
      'b2-01-r-compensation',
      'b2-01-r-points',
    ]);
    expect(identifiants('fp-challenge')).toEqual([]);
    expect(identifiants('fp-pulse')).toEqual([]);
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
    const base = { ...SOCLE_DE_QUESTION_FIGEE, id: 'Q', solution: () => 1 };
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
      ...EN_CATALOGUE,
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
