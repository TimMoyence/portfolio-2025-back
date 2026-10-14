import type { AnswerValue } from '../../domain/AnswerGrading';
import type { VerdictServi } from '../../domain/cours/EcranServi';

export interface SubmitAnswerCommand {
  sessionId: string;
  participantId: string;
  questionId: string;
  valeur: AnswerValue;
  dureeMs: number;
}

export type SubmitAnswerResult = VerdictServi;
