import {
  buildRapportParticipant,
  buildResultatQuestion,
} from '../../../../test/factories/formation.factory';
import { calculerStatistiquesSeance } from './SessionStatistics';

describe('calculerStatistiquesSeance', () => {
  it('calcule moyenne, médiane, dispersion et taux de classe', () => {
    const statistiques = calculerStatistiquesSeance(
      [
        buildRapportParticipant({ completion: 1, note: 10, sousSeuil: true }),
        buildRapportParticipant({ completion: 0.5, note: 20 }),
        buildRapportParticipant({ completion: 0, note: 0, sousSeuil: true }),
      ],
      {
        participants: 3,
        questions: [
          buildResultatQuestion({
            questionId: 'Q1',
            total: 3,
            correctes: 1,
          }),
          buildResultatQuestion({
            questionId: 'Q2',
            total: 2,
            correctes: 2,
          }),
        ],
      },
    );

    expect(statistiques).toEqual({
      moyenne: 10,
      mediane: 10,
      dispersion: 8.16,
      tauxParticipation: 2 / 3,
      tauxReussite: 3 / 5,
      questionsProblemes: ['Q1'],
    });
  });

  it('somme les notes triées, sans quoi 11,875 tomberait à 11,87', () => {
    const repondues = [1, 12, 8, 4, 12, 7, 11, 2];

    const statistiques = calculerStatistiquesSeance(
      repondues.map((questions) =>
        buildRapportParticipant({ note: (questions / 12) * 20 }),
      ),
      { participants: repondues.length, questions: [] },
    );

    expect(statistiques).toMatchObject({ moyenne: 11.88 });
  });
});
