import {
  buildAnswerRecord,
  buildBareme,
  buildParticipantRecord,
} from '../../../../test/factories/formation.factory';
import { NE_SAIT_PAS } from './GradingCore';
import { agregerResultats } from './ResultatsSeance';

describe('agregerResultats', () => {
  const bareme = buildBareme({
    questions: [
      {
        id: 'Q-1',
        type: 'numeric',
        concept: 'taux-evolution',
        noteCompte: true,
      },
      { id: 'Q-2', type: 'vote', concept: 'proportion', noteCompte: false },
    ],
  });

  it('compte par sens et non par valeur saisie', () => {
    const resultats = agregerResultats({
      bareme,
      participants: [
        buildParticipantRecord({ id: 'p1' }),
        buildParticipantRecord({ id: 'p2' }),
        buildParticipantRecord({ id: 'p3' }),
      ],
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
});
