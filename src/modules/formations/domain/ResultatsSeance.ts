import type { TypeQuestion } from './contrats/cours';
import { libelleDeConfusion } from './cours/banque/confusions';
import { NE_SAIT_PAS } from './GradingCore';
import type { AnswerRecord } from './IAnswers.repository';

const CLE_NE_SAIT_PAS = '__je_ne_sais_pas__';

export interface ConfusionComptee {
  readonly id: string;
  readonly libelle: string;
  readonly nombre: number;
}

interface JustesParCle {
  readonly total: number;
  readonly justes: number;
}

export interface QuestionAAgreger {
  readonly id: string;
  readonly type: TypeQuestion;
  readonly noteCompte: boolean;
  readonly ecranId: string;
}

export interface ResultatQuestion {
  readonly questionId: string;
  readonly ecranId: string;
  readonly type: TypeQuestion;
  readonly noteCompte: boolean;
  readonly total: number;
  readonly correctes: number;
  readonly neSaitPas: number;
  readonly confusions: readonly ConfusionComptee[];
  readonly parOption: Readonly<Record<string, number>> | null;
  readonly scoreMoyen: number | null;
  readonly parCle: Readonly<Record<string, JustesParCle>> | null;
}

export interface ResultatsSeance {
  readonly participants: number;
  readonly questions: readonly ResultatQuestion[];
}

export interface AgregerResultatsInput {
  readonly questions: readonly QuestionAAgreger[];
  readonly answers: readonly AnswerRecord[];
  readonly participants: number;
}

export function agregerResultats(
  entree: AgregerResultatsInput,
): ResultatsSeance {
  return {
    participants: entree.participants,
    questions: entree.questions.map((question) =>
      agregerQuestion(question, entree.answers),
    ),
  };
}

function agregerQuestion(
  question: QuestionAAgreger,
  answers: readonly AnswerRecord[],
): ResultatQuestion {
  const reponses = answers.filter(
    (reponse) => reponse.questionId === question.id,
  );
  return {
    questionId: question.id,
    ecranId: question.ecranId,
    type: question.type,
    noteCompte: question.noteCompte,
    total: reponses.length,
    correctes: reponses.filter((reponse) => reponse.correcte).length,
    neSaitPas: reponses.filter((reponse) => estNeSaitPas(reponse)).length,
    confusions: compterConfusions(reponses),
    parOption: question.type === 'vote' ? compterParOption(reponses) : null,
    scoreMoyen: moyenneDesScores(reponses),
    parCle: compterParCle(reponses),
  };
}

function estUneProduction(
  valeur: AnswerRecord['valeur'],
): valeur is Extract<AnswerRecord['valeur'], { readonly type: string }> {
  return typeof valeur === 'object';
}

function estNeSaitPas(reponse: AnswerRecord): boolean {
  if (reponse.valeur === NE_SAIT_PAS) {
    return true;
  }
  return estUneProduction(reponse.valeur) && 'neSaitPas' in reponse.valeur;
}

function compterParOption(
  reponses: readonly AnswerRecord[],
): Readonly<Record<string, number>> {
  const parOption: Record<string, number> = {};
  for (const reponse of reponses) {
    const cle = estNeSaitPas(reponse)
      ? CLE_NE_SAIT_PAS
      : cleDeVote(reponse.valeur);
    parOption[cle] = (parOption[cle] ?? 0) + 1;
  }
  return parOption;
}

function cleDeVote(valeur: AnswerRecord['valeur']): string {
  return estUneProduction(valeur) ? valeur.type : String(valeur);
}

function moyenneDesScores(reponses: readonly AnswerRecord[]): number | null {
  const scores = reponses
    .map((reponse) => reponse.score)
    .filter((score): score is number => score !== null);
  if (scores.length === 0) {
    return null;
  }
  return scores.reduce((somme, score) => somme + score, 0) / scores.length;
}

function compterParCle(
  reponses: readonly AnswerRecord[],
): Readonly<Record<string, JustesParCle>> | null {
  const parCle: Record<string, JustesParCle> = {};
  for (const reponse of reponses) {
    for (const detail of reponse.details ?? []) {
      const courant = parCle[detail.cle] ?? { total: 0, justes: 0 };
      parCle[detail.cle] = {
        total: courant.total + 1,
        justes: courant.justes + (detail.juste ? 1 : 0),
      };
    }
  }
  return Object.keys(parCle).length === 0 ? null : parCle;
}

function compterConfusions(
  reponses: readonly AnswerRecord[],
): readonly ConfusionComptee[] {
  const nombresParId = new Map<string, number>();
  for (const reponse of reponses) {
    if (reponse.misconception === null) {
      continue;
    }
    nombresParId.set(
      reponse.misconception,
      (nombresParId.get(reponse.misconception) ?? 0) + 1,
    );
  }
  return [...nombresParId.entries()]
    .map(([id, nombre]) => ({
      id,
      libelle: libelleDeConfusion(id) ?? id,
      nombre,
    }))
    .sort((premiere, seconde) =>
      premiere.nombre !== seconde.nombre
        ? seconde.nombre - premiere.nombre
        : premiere.id.localeCompare(seconde.id),
    );
}
