import type { AnswerValue } from './AnswerGrading';

export interface AnswerRecord {
  id: string;
  sessionId: string;
  participantId: string;
  questionId: string;
  concept: string;
  valeur: AnswerValue;
  seed: number;
  correcte: boolean;
  misconception: string | null;
  dureeMs: number;
  soumisLe: Date;
}

export interface CreateAnswerInput {
  sessionId: string;
  participantId: string;
  questionId: string;
  concept: string;
  valeur: AnswerValue;
  seed: number;
  correcte: boolean;
  misconception: string | null;
  dureeMs: number;
}

export interface QuestionTally {
  questionId: string;
  total: number;
  correctes: number;
  parMisconception: Readonly<Record<string, number>>;
}

export interface IAnswersRepository {
  create(input: CreateAnswerInput): Promise<AnswerRecord>;
  existsFor(participantId: string, questionId: string): Promise<boolean>;
  listBySession(sessionId: string): Promise<readonly AnswerRecord[]>;
  tallyBySession(sessionId: string): Promise<readonly QuestionTally[]>;
}
