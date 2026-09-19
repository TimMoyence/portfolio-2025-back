import { ResourceConflictError } from '../../../../common/domain/errors/ResourceConflictError';
import {
  buildCoursDeTest,
  buildCoursSansTirageValide,
  EN_CATALOGUE,
  tireurSequentiel,
} from '../../../../../test/factories/cours.factory';
import {
  BRIQUES_STOCKEES,
  buildCoursStockeV3,
  buildEcranStockeV3,
} from '../../../../../test/factories/ecrans-stockes.factory';
import { solutionFor } from '../Bareme';
import type { Cours } from '../contrats/cours';
import { questionNumerique, questionsDuCours } from './Cours';
import { lireCoursStocke } from './CoursStocke';
import {
  NOMBRE_TIRAGES_DISTRIBUES,
  ouvrirTirages,
  TiragesInsuffisantsError,
} from './OuvertureTirages';
import { tirer } from './Tirage';

const PLUS_GRAND_INTEGER_POSTGRESQL = 2_147_483_647;

describe('ouvrirTirages', () => {
  const cours = buildCoursDeTest();

  const coursSansQuestions = buildCoursDeTest({
    dureeMinutes: 2,
    ecrans: [
      {
        ...EN_CATALOGUE,
        id: 'E-LECTURE',
        brique: 'fp-quote',
        dureeMinutes: 2,
        concepts: ['proportion'],
        notes: '',
        proprietes: {
          texte: 'Lire avant de calculer.',
          auteur: null,
          source: null,
        },
      },
    ],
    remediations: {},
  });

  it('ouvre un cours sans questions sans générer de tirages', () => {
    expect(
      ouvrirTirages(coursSansQuestions, () => {
        throw new Error('un cours sans questions ne tire aucune graine');
      }),
    ).toEqual({
      version: 1,
      graineReference: 0,
      questions: [],
      tirages: [],
    });
  });

  it('distribue soixante tirages et garde une graine de reference hors distribution', () => {
    const bareme = ouvrirTirages(cours, tireurSequentiel());
    const graines = bareme.tirages.map((tirage) => tirage.seed);
    expect(bareme.tirages).toHaveLength(NOMBRE_TIRAGES_DISTRIBUES);
    expect(new Set(graines).size).toBe(NOMBRE_TIRAGES_DISTRIBUES);
    expect(graines).not.toContain(bareme.graineReference);
  });

  it('tire des graines que la colonne integer "seed" de PostgreSQL peut stocker', () => {
    const bornesRecues: number[] = [];
    const sequentiel = tireurSequentiel();
    ouvrirTirages(cours, (borne) => {
      bornesRecues.push(borne);
      return sequentiel(borne);
    });
    expect(bornesRecues.length).toBeGreaterThan(0);
    expect(
      bornesRecues.every((borne) => borne === PLUS_GRAND_INTEGER_POSTGRESQL),
    ).toBe(true);
  });

  it('couvre chaque question du cours dans chaque tirage', () => {
    const bareme = ouvrirTirages(cours, tireurSequentiel());
    const ids = bareme.questions.map((question) => question.id);
    expect(ids).toEqual([
      'Q-TEST-RAPPEL',
      'Q-TEST-NUM',
      'Q-TEST-NUM-2',
      'Q-TEST-NUM-3',
      'Q-TEST-VOTE',
      'Q-TEST-EXIT',
    ]);
    const parOrdreAlphabetique = (a: string, b: string) => a.localeCompare(b);
    for (const tirage of bareme.tirages) {
      expect(Object.keys(tirage.solutions).sort(parOrdreAlphabetique)).toEqual(
        [...ids].sort(parOrdreAlphabetique),
      );
      expect(tirage.solutions).toEqual(tirer(cours, tirage.seed).solutions);
    }
  });

  it('declare le type de correction et la tolerance de chaque question', () => {
    const bareme = ouvrirTirages(cours, tireurSequentiel());
    expect(bareme.questions[0]).toEqual({
      id: 'Q-TEST-RAPPEL',
      type: 'vote',
      concept: 'evolutions-successives',
      noteCompte: false,
    });
    expect(bareme.questions[1]).toEqual({
      id: 'Q-TEST-NUM',
      type: 'numeric',
      concept: 'taux-evolution',
      noteCompte: true,
      tolerance: { type: 'absolue', valeur: 0.01 },
    });
  });

  it('ignore une graine deja tiree', () => {
    const valeurs = [
      5,
      5,
      ...Array.from({ length: 200 }, (_, index) => 100 + index),
    ];
    const bareme = ouvrirTirages(cours, () => valeurs.shift() ?? 0);
    expect(bareme.graineReference).toBe(5);
    expect(bareme.tirages[0].seed).toBe(100);
  });

  it('ecarte les graines ambigues', () => {
    const paire = questionNumerique({
      id: 'Q-PAIRE',
      concept: 'proportion',
      noteCompte: false,
      donnees: (tirage) => ({ n: tirage.entier(0, 1) }),
      enonce: () => 'e',
      unite: null,
      solution: () => 10,
      tolerance: { type: 'absolue', valeur: 0 },
      pieges: [
        { confusion: 'base-arrivee', valeur: ({ n }) => (n === 0 ? 10 : 20) },
      ],
    });
    const cours2 = buildCoursDeTest({
      ecrans: [
        {
          ...EN_CATALOGUE,
          id: 'E',
          brique: 'fp-numeric',
          dureeMinutes: 1,
          concepts: ['proportion'],
          notes: '',
          question: paire,
        },
      ],
    });
    const bareme = ouvrirTirages(cours2, tireurSequentiel());
    for (const tirage of bareme.tirages) {
      expect(tirage.solutions['Q-PAIRE'].pieges[0].valeur).toBe(20);
    }
  });

  it('abandonne quand les graines restent ambigues, par une erreur de domaine en conflit', () => {
    const ouverture = () =>
      ouvrirTirages(buildCoursSansTirageValide(), tireurSequentiel());

    expect(ouverture).toThrow(TiragesInsuffisantsError);
    expect(ouverture).toThrow(ResourceConflictError);
    expect(ouverture).toThrow(
      `Le cours cours-sans-tirage ne produit pas ${NOMBRE_TIRAGES_DISTRIBUES + 1} tirages non ambigus : il ne peut pas être ouvert tant qu'il n'est pas corrigé.`,
    );
  });
});

describe('ouvrirTirages en barème v2 (version de cours ≥ 3)', () => {
  const cours = buildCoursDeTest();
  const statique = lireCoursStocke(
    buildCoursStockeV3(
      BRIQUES_STOCKEES.map((brique) => buildEcranStockeV3(brique)),
    ),
  );
  const ouvrirV2 = (cours: Cours) => {
    const bareme = ouvrirTirages(cours, tireurSequentiel(500), 3);
    if (bareme.version !== 2) {
      throw new Error('barème v2 attendu');
    }
    return bareme;
  };

  it('garde le barème v1 pour les versions 1 et 2', () => {
    expect(ouvrirTirages(statique, tireurSequentiel(), 2).version).toBe(1);
    expect(ouvrirTirages(cours, tireurSequentiel()).version).toBe(1);
  });

  it('rattache chaque question à son écran, son ouverture, son origine et son énigme', () => {
    const { questions } = ouvrirV2(statique);
    const question = (id: string) =>
      questions.find((candidate) => candidate.id === id);

    expect(question('b2-01-a3-sac-v1')).toMatchObject({
      ecranId: 'B2-01-A1-01-FP-VOTE',
      rangEcran: BRIQUES_STOCKEES.indexOf('fp-vote'),
      ouverture: 'principale',
    });
    expect(question('b2-01-a3-remise-v2')?.ouverture).toBe('jumelle');
    expect(question('b2-01-r-points')).toMatchObject({
      origine: 'banque',
      noteCompte: false,
    });
    expect(question('b2-01-a6-e1-mix')).toMatchObject({
      type: 'enigme',
      parcoursId: 'b2-01-a6-coffre',
      rangEnigme: 0,
    });
    expect(question('b2-01-a5-part-marge-marketplace')?.tolerance).toEqual({
      type: 'absolue',
      valeur: 0.05,
    });
    expect(questions.map((candidate) => candidate.id)).toEqual(
      questionsDuCours(statique).map((candidate) => candidate.id),
    );
  });

  it('met en commun les solutions identiques sur toutes les graines et garde les corrigés de production', () => {
    const bareme = ouvrirV2(statique);

    expect(bareme.tirages).toHaveLength(NOMBRE_TIRAGES_DISTRIBUES);
    expect(
      bareme.tirages.every(({ ecarts }) => Object.keys(ecarts).length === 0),
    ).toBe(true);
    expect(bareme.solutionsCommunes).toEqual(
      tirer(statique, bareme.graineReference).solutions,
    );
    expect(Object.keys(bareme.corriges)).toEqual([
      'b2-01-a1-anatomie',
      'b2-01-a4-feuille-canaux',
      'b2-01-a4-indice-toile',
      'b2-01-a6-e1-mix',
    ]);
  });

  it('garde en écart par graine les solutions qui varient d un tirage à l autre', () => {
    const bareme = ouvrirV2(cours);

    for (const { seed } of bareme.tirages) {
      for (const [id, solution] of Object.entries(
        tirer(cours, seed).solutions,
      )) {
        expect(solutionFor(bareme, seed, id)).toEqual(solution);
      }
    }
    expect(Object.keys(bareme.tirages[0].ecarts)).toContain('Q-TEST-NUM');
  });
});
