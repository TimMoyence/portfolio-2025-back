import type { AnswerValue } from '../../domain/notation/AnswerGrading';
import type { VerdictServi } from '../../domain/cours/diffusion/EcranServi';

export interface SubmitAnswerCommand {
  sessionId: string;
  participantId: string;
  questionId: string;
  valeur: AnswerValue;
  dureeMs: number;
}

export type SubmitAnswerResult = VerdictServi;
