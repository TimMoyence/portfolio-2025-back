import type { AnswerValue } from '../GradingCore';
import type { AnswerRecord as AnswerRecordServi } from '../IAnswers.repository';
import type {
  RapportQuestion as RapportQuestionServie,
  RapportSession,
} from '../IFormationMailer.port';
import type { StatistiquesSeance } from '../SessionStatistics';
import type { ConfusionId } from '../cours/banque/confusions';
import type { TypeQuestion } from './cours';
import type { RegleDeNotation } from './notation';

export type ValeurProduction =
  | {
      readonly type: 'feuille';
      readonly cellules: Readonly<Record<string, string>>;
    }
  | {
      readonly type: 'tableau';
      readonly saisies: readonly {
        readonly rang: number;
        readonly cle: string;
        readonly valeur: number;
      }[];
    }
  | {
      readonly type: 'classement';
      readonly classement: Readonly<Record<string, string>>;
    }
  | {
      readonly type: 'feuille' | 'tableau' | 'classement';
      readonly neSaitPas: true;
    };

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

export interface ConfusionComptee {
  readonly id: string;
  readonly libelle: string;
  readonly nombre: number;
}

export interface JustesParCle {
  readonly total: number;
  readonly justes: number;
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

export interface ComptesJalon {
  readonly perdu: number;
  readonly 'ca-va': number;
  readonly clair: number;
  readonly total: number;
}

export interface ProgressionEnigme {
  readonly parcoursId: string;
  readonly enigmeId: string;
  readonly ouvertes: number;
  readonly resolues: number;
  readonly tentativesMoyennes: number;
  readonly epuisees: number;
}

export interface ResumeBareme {
  readonly questionsNotees: number;
  readonly parType: Readonly<
    Record<
      TypeQuestion,
      { readonly notees: number; readonly nonNotees: number }
    >
  >;
}

export interface ResultatsEnDirect extends ResultatsSeance {
  readonly statistiques: StatistiquesSeance;
  readonly jalons: Readonly<Record<string, ComptesJalon>>;
  readonly enigmes: readonly ProgressionEnigme[];
  readonly bareme: ResumeBareme;
}

export type ResultatsDeSeance = RapportSession & {
  readonly resultats: ResultatsSeance;
  readonly statistiques: StatistiquesSeance;
  readonly notation: RegleDeNotation;
  readonly bareme: ResumeBareme;
  readonly jalons: Readonly<Record<string, ComptesJalon>>;
  readonly enigmes: readonly ProgressionEnigme[];
};
