import { calculerStatistiquesSeance } from './SessionStatistics';

describe('calculerStatistiquesSeance', () => {
  it('calcule moyenne, médiane, dispersion et taux de classe', () => {
    const statistiques = calculerStatistiquesSeance(
      [
        {
          prenom: 'A',
          nom: 'A',
          email: 'a',
          completion: 1,
          note: 10,
          sousSeuil: true,
          reponses: [],
          incidents: 0,
        },
        {
          prenom: 'B',
          nom: 'B',
          email: 'b',
          completion: 0.5,
          note: 20,
          sousSeuil: false,
          reponses: [],
          incidents: 0,
        },
        {
          prenom: 'C',
          nom: 'C',
          email: 'c',
          completion: 0,
          note: 0,
          sousSeuil: true,
          reponses: [],
          incidents: 0,
        },
      ],
      {
        participants: 3,
        questions: [
          {
            questionId: 'Q1',
            total: 3,
            correctes: 1,
            neSaitPas: 0,
            confusions: [],
          },
          {
            questionId: 'Q2',
            total: 2,
            correctes: 2,
            neSaitPas: 0,
            confusions: [],
          },
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
});
