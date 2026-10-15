import {
  buildAnswerRecord,
  buildQuestionAAgreger,
  buildResultatQuestion,
  detailsDeFeuilleAMoitieJuste,
  detailsDeFeuilleJuste,
} from '../../../../test/factories/formation.factory';
import { buildCoursAvecProductions } from '../../../../test/factories/cours.factory';
import {
  confusionDominante,
  corrigerProduction,
  ecranDeProduction,
} from './cours/ProductionSoumise';
import { NE_SAIT_PAS } from './GradingCore';
import type { AnswerRecord } from './IAnswers.repository';
import { agregerResultats } from './ResultatsSeance';

function reponseDeFeuilleAMoitieJuste(questionId: string): AnswerRecord {
  return buildAnswerRecord({
    questionId,
    valeur: { type: 'feuille', cellules: { D2: '=2' } },
    score: 0.5,
    details: detailsDeFeuilleAMoitieJuste(),
  });
}

describe('agregerResultats', () => {
  it('compte par sens et non par valeur saisie', () => {
    const resultats = agregerResultats({
      questions: [
        buildQuestionAAgreger({ id: 'Q-1' }),
        buildQuestionAAgreger({ id: 'Q-2' }),
      ],
      participants: 3,
      answers: [
        buildAnswerRecord({ questionId: 'Q-1', correcte: true, valeur: 12 }),
        buildAnswerRecord({
          questionId: 'Q-1',
          correcte: false,
          valeur: 8,
          misconception: 'base-arrivee',
        }),
        buildAnswerRecord({
          questionId: 'Q-1',
          correcte: false,
          valeur: 9,
          misconception: 'base-arrivee',
        }),
        buildAnswerRecord({
          questionId: 'Q-1',
          correcte: false,
          valeur: NE_SAIT_PAS,
        }),
        buildAnswerRecord({ questionId: 'Q-HORS', correcte: true }),
      ],
    });
    expect(resultats.participants).toBe(3);
    expect(resultats.questions).toEqual([
      buildResultatQuestion({
        questionId: 'Q-1',
        total: 4,
        correctes: 1,
        neSaitPas: 1,
        confusions: [
          {
            id: 'base-arrivee',
            libelle: expect.stringContaining('valeur d’arrivée') as string,
            nombre: 2,
          },
        ],
        confusionDominante: 'base-arrivee',
        part: 0.25,
      }),
      buildResultatQuestion({ questionId: 'Q-2' }),
    ]);
  });

  it('indexe un vote par identifiant stable d option et compte « je ne sais pas »', () => {
    const [question] = agregerResultats({
      questions: [buildQuestionAAgreger({ id: 'Q-VOTE', type: 'vote' })],
      participants: 3,
      answers: [
        buildAnswerRecord({ questionId: 'Q-VOTE', valeur: 'plus-25-pct-ecd9' }),
        buildAnswerRecord({ questionId: 'Q-VOTE', valeur: 'plus-25-pct-ecd9' }),
        buildAnswerRecord({ questionId: 'Q-VOTE', valeur: 'plus-20-pct-0a1b' }),
        buildAnswerRecord({ questionId: 'Q-VOTE', valeur: NE_SAIT_PAS }),
      ],
    }).questions;

    expect(question.parOption).toEqual({
      'plus-25-pct-ecd9': 2,
      'plus-20-pct-0a1b': 1,
      __je_ne_sais_pas__: 1,
    });
  });

  it('n indexe aucune option sur une question qui n est pas un vote', () => {
    const [question] = agregerResultats({
      questions: [buildQuestionAAgreger({ id: 'Q-NUM', type: 'numeric' })],
      participants: 1,
      answers: [buildAnswerRecord({ questionId: 'Q-NUM', valeur: 12 })],
    }).questions;

    expect(question.parOption).toBeNull();
  });

  it('rend le score moyen et le detail par cle des productions', () => {
    const [question] = agregerResultats({
      questions: [buildQuestionAAgreger({ id: 'Q-FEUILLE', type: 'feuille' })],
      participants: 2,
      answers: [
        buildAnswerRecord({
          questionId: 'Q-FEUILLE',
          valeur: { type: 'feuille', cellules: { D2: '=1' } },
          score: 1,
          details: detailsDeFeuilleJuste(),
        }),
        reponseDeFeuilleAMoitieJuste('Q-FEUILLE'),
      ],
    }).questions;

    expect(question.scoreMoyen).toBe(0.75);
    expect(question.parCle).toEqual({
      D2: { total: 2, justes: 1 },
      D3: { total: 2, justes: 2 },
    });
  });

  it('QA-06 · compte « je ne sais pas » d une production a zero et faux pour chaque cle', () => {
    const feuille = ecranDeProduction(
      buildCoursAvecProductions(),
      'Q-TEST-FEUILLE',
    );
    if (feuille === null) {
      throw new Error('feuille absente du cours de test');
    }
    const neSaitPas = { type: 'feuille', neSaitPas: true } as const;
    const verdict = corrigerProduction(
      feuille.question.corrige,
      neSaitPas,
      feuille,
    );
    const [question] = agregerResultats({
      questions: [
        buildQuestionAAgreger({ id: 'Q-TEST-FEUILLE', type: 'feuille' }),
      ],
      participants: 2,
      answers: [
        reponseDeFeuilleAMoitieJuste('Q-TEST-FEUILLE'),
        buildAnswerRecord({
          questionId: 'Q-TEST-FEUILLE',
          valeur: neSaitPas,
          correcte: verdict.correcte,
          score: verdict.score,
          details: verdict.details,
        }),
      ],
    }).questions;

    expect(question.neSaitPas).toBe(1);
    expect(question.scoreMoyen).toBe(0.25);
    expect(question.parCle).toEqual({
      D2: { total: 2, justes: 0 },
      D3: { total: 2, justes: 1 },
    });
  });

  it('departage deux confusions de meme frequence par leur identifiant', () => {
    const fausse = (misconception: string) =>
      buildAnswerRecord({ questionId: 'Q-1', correcte: false, misconception });

    const [question] = agregerResultats({
      questions: [buildQuestionAAgreger({ id: 'Q-1' })],
      participants: 5,
      answers: [
        fausse('taux-successifs-additionnes'),
        fausse('base-arrivee'),
        fausse('taux-successifs-additionnes'),
        fausse('base-arrivee'),
        fausse('raisonnement-additif'),
      ],
    }).questions;

    expect(
      question.confusions.map(({ id, nombre }) => ({ id, nombre })),
    ).toEqual([
      { id: 'base-arrivee', nombre: 2 },
      { id: 'taux-successifs-additionnes', nombre: 2 },
      { id: 'raisonnement-additif', nombre: 1 },
    ]);
  });

  it('libelle une confusion absente de la banque par son identifiant', () => {
    const [question] = agregerResultats({
      questions: [buildQuestionAAgreger({ id: 'Q-1' })],
      participants: 1,
      answers: [
        buildAnswerRecord({
          questionId: 'Q-1',
          correcte: false,
          misconception: 'interet-simple',
        }),
      ],
    }).questions;

    expect(question.confusions).toEqual([
      { id: 'interet-simple', libelle: 'interet-simple', nombre: 1 },
    ]);
  });
});

describe('B-70 · lecture du seuil de chaque question', () => {
  const REMEDIATIONS = { 'base-arrivee': 'E-REMEDIATION' };
  const reponse = (correcte: boolean, misconception: string | null = null) =>
    buildAnswerRecord({ questionId: 'Q-1', correcte, misconception });
  const lire = (
    seuil: number | null,
    answers: readonly AnswerRecord[],
    remediations: Readonly<Record<string, string>> = REMEDIATIONS,
  ) =>
    agregerResultats({
      questions: [buildQuestionAAgreger({ id: 'Q-1', seuil })],
      participants: answers.length,
      answers,
      remediations,
    }).questions[0];

  it('sert l écran qui remédie la confusion dominante sous le seuil', () => {
    expect(
      lire(0.7, [
        reponse(true),
        reponse(false, 'taux-successifs-additionnes'),
        reponse(false, 'base-arrivee'),
        reponse(false, 'base-arrivee'),
      ]),
    ).toMatchObject({
      confusionDominante: 'base-arrivee',
      part: 0.25,
      sousLeSeuil: true,
      remediation: { confusionId: 'base-arrivee', ecranId: 'E-REMEDIATION' },
    });
  });

  it('ne remédie rien quand la part atteint le seuil', () => {
    expect(
      lire(0.5, [reponse(true), reponse(false, 'base-arrivee')]),
    ).toMatchObject({
      confusionDominante: 'base-arrivee',
      part: 0.5,
      sousLeSeuil: false,
      remediation: null,
    });
  });

  it('ne lit aucun seuil sans réponse ni sur un écran qui n en porte pas', () => {
    expect(
      [lire(0.7, []), lire(null, [reponse(false, 'base-arrivee')])].map(
        ({ part, sousLeSeuil, remediation }) => ({
          part,
          sousLeSeuil,
          remediation,
        }),
      ),
    ).toEqual([
      { part: 0, sousLeSeuil: false, remediation: null },
      { part: 0, sousLeSeuil: false, remediation: null },
    ]);
  });

  it('ne remédie rien quand la confusion dominante n a pas d écran de remédiation', () => {
    expect(lire(0.7, [reponse(false, 'raisonnement-additif')])).toMatchObject({
      confusionDominante: 'raisonnement-additif',
      sousLeSeuil: true,
      remediation: null,
    });
  });

  it('ne prend pas une clé héritée de l objet pour une remédiation', () => {
    expect(
      lire(0.7, [reponse(false, 'constructor')], {}).remediation,
    ).toBeNull();
  });

  it('retient à égalité la même confusion dominante que la production d un élève', () => {
    const ordre = ['taux-valeur-facteur-cent', 'base-arrivee'] as const;

    const classe = lire(
      0.7,
      ordre.map((confusion) => reponse(false, confusion)),
    );
    const eleve = confusionDominante(
      ordre.map((confusion, rang) => ({
        cle: `D${rang + 2}`,
        juste: false,
        confusion,
      })),
    );

    expect([classe.confusionDominante, eleve]).toEqual([
      'base-arrivee',
      'base-arrivee',
    ]);
  });
});
