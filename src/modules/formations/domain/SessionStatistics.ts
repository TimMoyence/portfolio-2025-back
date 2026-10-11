import { estAuMoinsUn } from '../../../common/domain/au-moins-un';
import { arrondi } from '../../../common/domain/nombres/arrondi';
import {
  ecartTypePopulation,
  mediane,
  moyenne,
  proportion,
  somme,
} from '../../../common/domain/nombres/statistiques';
import type { RapportParticipant } from './IFormationMailer.port';
import { REGLE_DE_NOTATION } from './RegleDeNotation';
import type { ResultatsSeance } from './ResultatsSeance';

const {
  seuilQuestionProbleme,
  decimalesStatistiques,
  statistiquesSurQuestionsNotees,
} = REGLE_DE_NOTATION;

export interface StatistiquesSeance {
  readonly moyenne: number;
  readonly mediane: number;
  readonly dispersion: number;
  readonly tauxParticipation: number;
  readonly tauxReussite: number;
  readonly questionsProblemes: readonly string[];
}

export function calculerStatistiquesSeance(
  participants: readonly RapportParticipant[],
  resultats: ResultatsSeance,
): StatistiquesSeance {
  const questionsComptees = statistiquesSurQuestionsNotees
    ? resultats.questions.filter((question) => question.noteCompte)
    : resultats.questions;
  const reponses = somme(questionsComptees.map((question) => question.total));
  const correctes = somme(
    questionsComptees.map((question) => question.correctes),
  );
  return {
    ...repartitionDesNotes(
      participants
        .map((participant) => participant.note)
        .sort((gauche, droite) => gauche - droite),
    ),
    tauxParticipation: estAuMoinsUn(participants)
      ? proportion(participants, (participant) => participant.completion > 0)
      : 0,
    tauxReussite: reponses === 0 ? 0 : correctes / reponses,
    questionsProblemes: questionsComptees
      .filter(
        (question) =>
          question.total > 0 &&
          question.correctes / question.total < seuilQuestionProbleme,
      )
      .map((question) => question.questionId),
  };
}

function repartitionDesNotes(
  notes: readonly number[],
): Pick<StatistiquesSeance, 'moyenne' | 'mediane' | 'dispersion'> {
  if (!estAuMoinsUn(notes)) {
    return { moyenne: 0, mediane: 0, dispersion: 0 };
  }
  return {
    moyenne: arrondir(moyenne(notes)),
    mediane: arrondir(mediane(notes)),
    dispersion: arrondir(ecartTypePopulation(notes)),
  };
}

function arrondir(valeur: number): number {
  return arrondi(valeur, decimalesStatistiques);
}
