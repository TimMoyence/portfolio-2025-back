import {
  buildAnswerRecord,
  buildQuestionAAgreger,
  buildResultatQuestion,
  detailsDeFeuilleAMoitieJuste,
  detailsDeFeuilleJuste,
} from '../../../../test/factories/formation.factory';
import { NE_SAIT_PAS } from './GradingCore';
import { agregerResultats } from './ResultatsSeance';

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
        buildAnswerRecord({
          questionId: 'Q-FEUILLE',
          valeur: { type: 'feuille', cellules: { D2: '=2' } },
          score: 0.5,
          details: detailsDeFeuilleAMoitieJuste(),
        }),
      ],
    }).questions;

    expect(question.scoreMoyen).toBe(0.75);
    expect(question.parCle).toEqual({
      D2: { total: 2, justes: 1 },
      D3: { total: 2, justes: 2 },
    });
  });

  it('compte « je ne sais pas » d une production comme une reponse sans saisie', () => {
    const [question] = agregerResultats({
      questions: [buildQuestionAAgreger({ id: 'Q-FEUILLE', type: 'feuille' })],
      participants: 1,
      answers: [
        buildAnswerRecord({
          questionId: 'Q-FEUILLE',
          valeur: { type: 'feuille', neSaitPas: true },
          score: 0,
          details: [],
        }),
      ],
    }).questions;

    expect(question.neSaitPas).toBe(1);
    expect(question.parCle).toBeNull();
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
