import { ResourceConflictError } from '../../../../common/domain/errors/ResourceConflictError';
import {
  buildCoursDeTest,
  buildCoursSansTirageValide,
  tireurSequentiel,
} from '../../../../../test/factories/cours.factory';
import { questionNumerique } from './Cours';
import {
  BORNE_GRAINE,
  NOMBRE_TIRAGES_DISTRIBUES,
  ouvrirTirages,
  TiragesInsuffisantsError,
} from './OuvertureTirages';
import { tirer } from './Tirage';

describe('ouvrirTirages', () => {
  const cours = buildCoursDeTest();

  const coursSansQuestions = buildCoursDeTest({
    dureeMinutes: 2,
    ecrans: [
      {
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

  it('interroge le tireur avec la borne de graine', () => {
    const bornesRecues: number[] = [];
    const sequentiel = tireurSequentiel();
    ouvrirTirages(cours, (borne) => {
      bornesRecues.push(borne);
      return sequentiel(borne);
    });
    expect(bornesRecues.length).toBeGreaterThan(0);
    expect(bornesRecues.every((borne) => borne === BORNE_GRAINE)).toBe(true);
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
