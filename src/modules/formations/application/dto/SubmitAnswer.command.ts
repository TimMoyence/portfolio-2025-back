import type { AnswerValue } from '../../domain/AnswerGrading';

export interface SubmitAnswerCommand {
  sessionId: string;
  participantId: string;
  questionId: string;
  valeur: AnswerValue;
  dureeMs: number;
}

export interface SubmitAnswerResult {
  correcte: boolean;
  misconception: string | null;
}
