import type {
  ComptesJalon,
  ProgressionEnigme,
  RegleDeNotation,
  ResultatsSeance,
  ResumeBareme,
  StatistiquesSeance,
  TypeQuestion,
  ValeurProduction,
} from 'portfolio-2025-partage/contrats';
import type { AnswerValue } from '../GradingCore';
import type { AnswerRecord as AnswerRecordServi } from '../IAnswers.repository';
import type {
  RapportQuestion as RapportQuestionServie,
  RapportSession,
} from '../IFormationMailer.port';
import type { ConfusionId } from '../cours/banque/confusions';

export type {
  ComptesJalon,
  ConfusionComptee,
  Decompte,
  ProgressionEnigme,
  ResultatQuestion,
  ResultatsEnDirect,
  ResultatsSeance,
  ResumeBareme,
  ValeurProduction,
} from 'portfolio-2025-partage/contrats';

export type ValeurReponse = AnswerValue | ValeurProduction;

export interface DetailProduction {
  readonly cle: string;
  readonly juste: boolean;
  readonly confusion: ConfusionId | null;
}

export interface AnswerRecord extends Omit<AnswerRecordServi, 'valeur'> {
  valeur: ValeurReponse;
  score: number | null;
  details: readonly DetailProduction[] | null;
}

export interface RapportQuestion extends RapportQuestionServie {
  type: TypeQuestion;
  score: number | null;
}

export type ResultatsDeSeance = RapportSession & {
  readonly resultats: ResultatsSeance;
  readonly statistiques: StatistiquesSeance;
  readonly notation: RegleDeNotation;
  readonly bareme: ResumeBareme;
  readonly jalons: Readonly<Record<string, ComptesJalon>>;
  readonly enigmes: readonly ProgressionEnigme[];
};
