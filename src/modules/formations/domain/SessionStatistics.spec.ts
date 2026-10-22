import {
  buildRapportParticipant,
  buildResultatQuestion,
} from '../../../../test/factories/formation.factory';
import { calculerStatistiquesSeance } from './SessionStatistics';

describe('calculerStatistiquesSeance', () => {
  it('calcule les taux de classe, sans note ni statistique de note', () => {
    const statistiques = calculerStatistiquesSeance(
      [
        buildRapportParticipant({ completion: 1 }),
        buildRapportParticipant({ completion: 0.5 }),
        buildRapportParticipant({ completion: 0 }),
      ],
      {
        questions: [
          buildResultatQuestion({
            questionId: 'Q1',
            total: 3,
            correctes: 1,
            part: 1 / 3,
            sousLeSeuil: true,
          }),
          buildResultatQuestion({
            questionId: 'Q2',
            total: 2,
            correctes: 2,
            part: 1,
          }),
        ],
      },
    );

    expect(statistiques).toEqual({
      tauxParticipation: 2 / 3,
      tauxReussite: 3 / 5,
      questionsProblemes: ['Q1'],
    });
  });

  it('retient les questions problemes sur le seuil servi, sans refaire la comparaison', () => {
    const statistiques = calculerStatistiquesSeance([], {
      questions: [
        buildResultatQuestion({
          questionId: 'Q-PART-BASSE',
          total: 4,
          correctes: 4,
          part: 0.25,
          sousLeSeuil: true,
        }),
        buildResultatQuestion({
          questionId: 'Q-PART-HAUTE',
          total: 4,
          correctes: 0,
          part: 0.25,
          sousLeSeuil: false,
        }),
        buildResultatQuestion({
          questionId: 'Q-SANS-REPONSE',
          total: 0,
          correctes: 0,
          part: 0,
        }),
      ],
    });

    expect(statistiques.questionsProblemes).toEqual(['Q-PART-BASSE']);
  });

  it('pèse la réussite par la part servie : dix feuilles à 0,9 de score réussissent à 90 %, pas 0 %', () => {
    const statistiques = calculerStatistiquesSeance([], {
      questions: [
        buildResultatQuestion({
          questionId: 'Q-FEUILLE',
          total: 10,
          correctes: 0,
          scoreMoyen: 0.9,
          part: 0.9,
        }),
        buildResultatQuestion({
          questionId: 'Q-VOTE',
          total: 10,
          correctes: 5,
          part: 0.5,
        }),
      ],
    });

    expect(statistiques.tauxReussite).toBeCloseTo(0.7);
  });
});
