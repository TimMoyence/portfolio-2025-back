import { moyenneOu } from '../../../common/domain/nombres/statistiques';
import type { TypeQuestion } from './contrats/cours';
import type {
  ConfusionComptee,
  Decompte,
  ResultatQuestion,
  ResultatsSeance,
} from './contrats/resultats';
import {
  confusionsParFrequence,
  libelleDeConfusion,
} from './cours/banque/confusions';
import { NE_SAIT_PAS } from './GradingCore';
import type { AnswerRecord } from './IAnswers.repository';
import { estUneProduction, texteDeValeur } from './ValeurReponse';

export type {
  ConfusionComptee,
  ResultatQuestion,
  ResultatsSeance,
} from './contrats/resultats';

const CLE_NE_SAIT_PAS = '__je_ne_sais_pas__';

export interface QuestionAAgreger {
  readonly id: string;
  readonly type: TypeQuestion;
  readonly noteCompte: boolean;
  readonly ecranId: string;
  readonly seuil: number | null;
}

export interface AgregerResultatsInput {
  readonly questions: readonly QuestionAAgreger[];
  readonly answers: readonly AnswerRecord[];
  readonly participants: number;
  readonly remediations?: Readonly<Record<string, string>>;
}

export function agregerResultats(
  entree: AgregerResultatsInput,
): ResultatsSeance {
  return {
    participants: entree.participants,
    questions: entree.questions.map((question) =>
      agregerQuestion(question, entree.answers, entree.remediations ?? {}),
    ),
  };
}

function agregerQuestion(
  question: QuestionAAgreger,
  answers: readonly AnswerRecord[],
  remediations: Readonly<Record<string, string>>,
): ResultatQuestion {
  const reponses = answers.filter(
    (reponse) => reponse.questionId === question.id,
  );
  const decompte = {
    total: reponses.length,
    correctes: reponses.filter((reponse) => reponse.correcte).length,
    confusions: compterConfusions(reponses),
  };
  return {
    questionId: question.id,
    ecranId: question.ecranId,
    type: question.type,
    noteCompte: question.noteCompte,
    ...decompte,
    neSaitPas: reponses.filter((reponse) => estNeSaitPas(reponse)).length,
    parOption: question.type === 'vote' ? compterParOption(reponses) : null,
    scoreMoyen: moyenneDesScores(reponses),
    parCle: compterParCle(reponses),
    ...lectureDuSeuil(question, decompte, remediations),
  };
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
      : texteDeValeur(reponse.valeur);
    parOption[cle] = (parOption[cle] ?? 0) + 1;
  }
  return parOption;
}

function moyenneDesScores(reponses: readonly AnswerRecord[]): number | null {
  const scores = reponses
    .map((reponse) => reponse.score)
    .filter((score): score is number => score !== null);
  return moyenneOu(scores, null);
}

function compterParCle(
  reponses: readonly AnswerRecord[],
): Readonly<Record<string, Decompte>> | null {
  const parCle: Record<string, Decompte> = {};
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
  return confusionsParFrequence(
    reponses.map((reponse) => reponse.misconception),
  ).map(([id, nombre]) => ({
    id,
    libelle: libelleDeConfusion(id) ?? id,
    nombre,
  }));
}

function lectureDuSeuil(
  question: QuestionAAgreger,
  {
    total,
    correctes,
    confusions,
  }: Pick<ResultatQuestion, 'total' | 'correctes' | 'confusions'>,
  remediations: Readonly<Record<string, string>>,
): Pick<
  ResultatQuestion,
  'confusionDominante' | 'part' | 'sousLeSeuil' | 'remediation'
> {
  const part = total > 0 ? correctes / total : 0;
  const sousLeSeuil =
    question.seuil !== null && total > 0 && part < question.seuil;
  const dominante = confusions.at(0)?.id ?? null;
  const ecranId =
    dominante !== null && Object.hasOwn(remediations, dominante)
      ? remediations[dominante]
      : null;
  return {
    confusionDominante: dominante,
    part,
    sousLeSeuil,
    remediation:
      sousLeSeuil && dominante !== null && ecranId !== null
        ? { confusionId: dominante, ecranId }
        : null,
  };
}
