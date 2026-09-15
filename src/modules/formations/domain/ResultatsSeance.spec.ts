import { buildAnswerRecord } from '../../../../test/factories/formation.factory';
import { NE_SAIT_PAS } from './GradingCore';
import { agregerResultats } from './ResultatsSeance';

describe('agregerResultats', () => {
  it('compte par sens et non par valeur saisie', () => {
    const resultats = agregerResultats({
      questionIds: ['Q-1', 'Q-2'],
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
      {
        questionId: 'Q-1',
        total: 4,
        correctes: 1,
        neSaitPas: 1,
        confusions: [
          {
            id: 'base-arrivee',
            libelle: expect.stringContaining('valeur d’arrivée'),
            nombre: 2,
          },
        ],
      },
      {
        questionId: 'Q-2',
        total: 0,
        correctes: 0,
        neSaitPas: 0,
        confusions: [],
      },
    ]);
  });

  it('departage deux confusions de meme frequence par leur identifiant', () => {
    const fausse = (misconception: string) =>
      buildAnswerRecord({ questionId: 'Q-1', correcte: false, misconception });

    const [question] = agregerResultats({
      questionIds: ['Q-1'],
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
      questionIds: ['Q-1'],
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
