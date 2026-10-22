import type { StatistiquesSeance } from './contrats/contrat-de-l-api';
import { estAuMoinsUn } from '../../../common/domain/au-moins-un';
import { proportion, somme } from '../../../common/domain/nombres/statistiques';
import type { RapportParticipant } from './IFormationMailer.port';
import { REGLE_DE_NOTATION } from './RegleDeNotation';
import type { ResultatsSeance } from './ResultatsSeance';

const { statistiquesSurQuestionsNotees } = REGLE_DE_NOTATION;

export type { StatistiquesSeance } from './contrats/contrat-de-l-api';

export function calculerStatistiquesSeance(
  participants: readonly RapportParticipant[],
  resultats: Pick<ResultatsSeance, 'questions'>,
): StatistiquesSeance {
  const questionsComptees = statistiquesSurQuestionsNotees
    ? resultats.questions.filter((question) => question.noteCompte)
    : resultats.questions;
  const reponses = somme(questionsComptees.map((question) => question.total));
  const reussies = somme(
    questionsComptees.map((question) => question.part * question.total),
  );
  return {
    tauxParticipation: estAuMoinsUn(participants)
      ? proportion(participants, (participant) => participant.completion > 0)
      : 0,
    tauxReussite: reponses === 0 ? 0 : reussies / reponses,
    questionsProblemes: questionsComptees
      .filter((question) => question.sousLeSeuil)
      .map((question) => question.questionId),
  };
}
