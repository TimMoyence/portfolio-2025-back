import { buildCoursDeTest } from '../../../../test/factories/cours.factory';
import {
  buildBareme,
  buildBaremeV2,
} from '../../../../test/factories/formation.factory';
import {
  estValeurConnue,
  findQuestion,
  pickFreeSeed,
  questionDuBareme,
  questionsNotees,
  solutionFor,
  solutionsDuTirage,
  solutionsIdentiques,
} from './Bareme';
import type { Bareme } from './Bareme';
import { NE_SAIT_PAS } from './GradingCore';
import type { Solution } from './AnswerGrading';

const bareme: Bareme = buildBareme();

describe('findQuestion', () => {
  it('retrouve une question par son identifiant', () => {
    expect(findQuestion(bareme, 'Q-CAP-03')?.concept).toBe('capitalisation');
  });

  it('retourne null pour un identifiant inconnu', () => {
    expect(findQuestion(bareme, 'Q-INCONNU')).toBeNull();
  });
});

describe('solutionFor', () => {
  it('retourne la solution du tirage demande', () => {
    expect(solutionFor(bareme, 1002, 'Q-CAP-03')?.valeur).toBe(1500);
  });

  it('retourne null pour un seed absent', () => {
    expect(solutionFor(bareme, 9999, 'Q-CAP-03')).toBeNull();
  });
});

describe('estValeurConnue', () => {
  const solution: Solution = {
    valeur: 'b',
    pieges: [{ valeur: 'a', misconception: 'interet-simple' }],
  };

  it('accepte la valeur de la solution', () => {
    expect(estValeurConnue(solution, 'b')).toBe(true);
  });

  it('accepte la valeur d un piege', () => {
    expect(estValeurConnue(solution, 'a')).toBe(true);
  });

  it('accepte je ne sais pas', () => {
    expect(estValeurConnue(solution, NE_SAIT_PAS)).toBe(true);
  });

  it('refuse une valeur hors solution et hors pieges', () => {
    expect(estValeurConnue(solution, '<img src=x onerror=alert(1)>')).toBe(
      false,
    );
  });

  it('refuse toute valeur quand le tirage n a aucun piege', () => {
    const sansPiege: Solution = { valeur: 'b', pieges: [] };
    expect(estValeurConnue(sansPiege, 'a')).toBe(false);
  });
});

describe('pickFreeSeed', () => {
  it('attribue des seeds techniques quand le cours ne contient aucune question', () => {
    const sansQuestions: Bareme = {
      version: 1,
      graineReference: 0,
      questions: [],
      tirages: [],
    };
    expect(pickFreeSeed(sansQuestions, [0, 1])).toBe(2);
  });

  it('retourne un seed non attribue', () => {
    expect(pickFreeSeed(bareme, [1001])).toBe(1002);
  });

  it('retourne null quand tous les seeds sont pris', () => {
    expect(pickFreeSeed(bareme, [1001, 1002])).toBeNull();
  });

  it('retourne le premier seed sur une session vide', () => {
    expect(pickFreeSeed(bareme, [])).toBe(1001);
  });
});

describe('solutionsIdentiques', () => {
  const attendues: Readonly<Record<string, Solution>> = {
    'Q-CAP-03': {
      valeur: 1338.23,
      pieges: [{ valeur: 1300, misconception: 'interet-simple' }],
    },
    'Q-TEG-02': { valeur: 4.27, pieges: [] },
  };

  it('accepte un ordre de cles different, jsonb reordonnant les cles', () => {
    const stockees: Readonly<Record<string, Solution>> = {
      'Q-TEG-02': { valeur: 4.27, pieges: [] },
      'Q-CAP-03': {
        valeur: 1338.23,
        pieges: [{ valeur: 1300, misconception: 'interet-simple' }],
      },
    };

    expect(solutionsIdentiques(attendues, stockees)).toBe(true);
  });

  it('refuse une valeur de solution differente', () => {
    const stockees: Readonly<Record<string, Solution>> = {
      ...attendues,
      'Q-CAP-03': { valeur: 1500, pieges: attendues['Q-CAP-03'].pieges },
    };

    expect(solutionsIdentiques(attendues, stockees)).toBe(false);
  });

  it.each([
    [
      'refuse un piege qui ne correspond plus',
      { valeur: 1300, misconception: 'autre-confusion' },
    ],
    [
      'refuse un piege de meme confusion dont seule la valeur a change',
      { valeur: 1299, misconception: 'interet-simple' },
    ],
  ])('%s', (_titre, piege) => {
    const stockees: Readonly<Record<string, Solution>> = {
      ...attendues,
      'Q-CAP-03': { valeur: attendues['Q-CAP-03'].valeur, pieges: [piege] },
    };

    expect(solutionsIdentiques(attendues, stockees)).toBe(false);
  });

  it('refuse un nombre de pieges different, meme quand les premiers concordent', () => {
    const plusDePieges: Readonly<Record<string, Solution>> = {
      ...attendues,
      'Q-CAP-03': {
        valeur: attendues['Q-CAP-03'].valeur,
        pieges: [
          ...attendues['Q-CAP-03'].pieges,
          { valeur: 1400, misconception: 'autre-confusion' },
        ],
      },
    };

    expect(solutionsIdentiques(attendues, plusDePieges)).toBe(false);
    expect(solutionsIdentiques(plusDePieges, attendues)).toBe(false);
  });

  it('refuse quand une cle attendue manque cote stockage', () => {
    const stockees: Readonly<Record<string, Solution>> = Object.fromEntries(
      Object.entries(attendues).filter(([cle]) => cle !== 'Q-TEG-02'),
    );

    expect(solutionsIdentiques(attendues, stockees)).toBe(false);
  });

  it('refuse un stockage absent', () => {
    expect(solutionsIdentiques(attendues, undefined)).toBe(false);
  });
});

describe('barème v2 (§ 9.3.4)', () => {
  const v2 = buildBaremeV2();

  it('rend l écart de la graine avant la solution commune', () => {
    expect(solutionFor(v2, 12, 'b2-01-a2-part-marketplace')).toEqual({
      valeur: 12.5,
      pieges: [],
    });
    expect(solutionFor(v2, 11, 'b2-01-a2-part-marketplace')).toEqual(
      v2.solutionsCommunes['b2-01-a2-part-marketplace'],
    );
    expect(solutionFor(v2, 11, 'b2-01-a1-diagnostic')?.valeur).toBe(
      'plus-25-pct-ecd953a1',
    );
  });

  it('ne rend aucune solution à une graine absente du barème ni à une production', () => {
    expect(solutionFor(v2, 999, 'b2-01-a1-diagnostic')).toBeNull();
    expect(solutionFor(v2, 11, 'b2-01-a4-feuille-canaux')).toBeNull();
  });

  it('reconstitue les solutions complètes d une graine', () => {
    expect(solutionsDuTirage(v2, 12)).toEqual({
      ...v2.solutionsCommunes,
      'b2-01-a2-part-marketplace': { valeur: 12.5, pieges: [] },
    });
    expect(solutionsDuTirage(v2, 999)).toBeUndefined();
    expect(solutionsDuTirage(bareme, 1002)).toEqual(
      bareme.tirages[1].solutions,
    );
  });

  it('retrouve une question, distribue les graines et liste les questions notées', () => {
    expect(findQuestion(v2, 'b2-01-a4-feuille-canaux')?.type).toBe('feuille');
    expect(pickFreeSeed(v2, [11])).toBe(12);
    expect(questionsNotees(v2).map((question) => question.id)).toEqual([
      'b2-01-a1-diagnostic',
      'b2-01-a2-part-marketplace',
      'b2-01-a4-feuille-canaux',
    ]);
    expect(questionsNotees(bareme).map((question) => question.id)).toEqual([
      'Q-CAP-03',
    ]);
  });

  describe('questionDuBareme', () => {
    const cours = buildCoursDeTest();

    it('rend la question v2 telle qu elle est stockée', () => {
      expect(questionDuBareme(v2, 'b2-01-r-compensation', null)).toEqual(
        v2.questions[3],
      );
    });

    it('dérive du cours l écran d une question d un barème v1', () => {
      const v1 = buildBareme({
        questions: [
          {
            id: 'Q-TEST-VOTE',
            type: 'vote',
            concept: 'evolutions-successives',
            noteCompte: false,
          },
        ],
        tirages: [],
      });

      expect(questionDuBareme(v1, 'Q-TEST-VOTE', cours)).toEqual({
        id: 'Q-TEST-VOTE',
        type: 'vote',
        concept: 'evolutions-successives',
        noteCompte: false,
        ecranId: 'E-PRATIQUE',
        rangEcran: 4,
      });
      expect(questionDuBareme(v1, 'Q-TEST-VOTE', null)).toBeNull();
      expect(questionDuBareme(v1, 'Q-INCONNUE', cours)).toBeNull();
    });
  });
});
