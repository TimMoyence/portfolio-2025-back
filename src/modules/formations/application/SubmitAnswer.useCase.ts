import { Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { gradeAnswer } from '../domain/AnswerGrading';
import { estValeurConnue, findQuestion, solutionFor } from '../domain/Bareme';
import { libelleLisible } from '../domain/cours/banque/confusions';
import { assertEcranServi, rangDeLaQuestion } from '../domain/cours/EcranServi';
import { assertPhaseOuverte } from '../domain/cours/PilotageEcrans';
import { AnswerAlreadySubmittedError } from '../domain/errors/FormationErrors';
import { coursDeLaSeance, seanceOuverteAuxReponses } from './CoursDeLaSeance';
import { EnregistrementDeReponse } from './EnregistrementDeReponse';
import { participantActif } from './ParticipantActif';
import type {
  SubmitAnswerCommand,
  SubmitAnswerResult,
} from './dto/SubmitAnswer.command';

const TYPES_A_ROUTE_PROPRE: readonly string[] = [
  'feuille',
  'tableau',
  'classement',
  'enigme',
];

@Injectable()
export class SubmitAnswerUseCase extends EnregistrementDeReponse {
  async execute(command: SubmitAnswerCommand): Promise<SubmitAnswerResult> {
    const session = await seanceOuverteAuxReponses(
      this.sessions,
      command.sessionId,
    );

    const deja = await this.answers.existsFor(
      command.participantId,
      command.questionId,
    );
    if (deja) {
      throw new AnswerAlreadySubmittedError(command.questionId);
    }

    const participant = await participantActif(
      this.participants,
      command.sessionId,
      command.participantId,
    );

    const question = findQuestion(session.bareme, command.questionId);
    if (!question) {
      throw new DomainValidationError(
        `Question absente du bareme: ${command.questionId}`,
      );
    }
    if (TYPES_A_ROUTE_PROPRE.includes(question.type)) {
      throw new DomainValidationError(
        `La question ${command.questionId} de type ${question.type} passe par sa propre route`,
      );
    }
    const cours = await coursDeLaSeance(this.catalogue, session);
    const rangEcran =
      'rangEcran' in question
        ? question.rangEcran
        : rangDeLaQuestion(cours, command.questionId);
    const ecranId =
      'ecranId' in question
        ? question.ecranId
        : (cours.ecrans[rangEcran]?.id ?? command.questionId);
    assertEcranServi(session, rangEcran, ecranId, cours.ecrans.length);
    assertPhaseOuverte(session.pilotageEcrans, {
      ...question,
      ecranId,
    });

    const solution = solutionFor(
      session.bareme,
      participant.seed,
      command.questionId,
    );
    if (!solution) {
      throw new DomainValidationError(
        `Aucune solution du tirage de ce participant pour ${command.questionId}`,
      );
    }

    if (
      question.type === 'vote' &&
      !estValeurConnue(solution, command.valeur)
    ) {
      throw new DomainValidationError(
        `Valeur hors des options connues pour ${command.questionId}`,
      );
    }

    const verdict = gradeAnswer(command.valeur, solution, question.tolerance);

    await this.answers.create({
      sessionId: command.sessionId,
      participantId: command.participantId,
      questionId: command.questionId,
      concept: question.concept,
      valeur: command.valeur,
      seed: participant.seed,
      correcte: verdict.correcte,
      misconception: verdict.misconception,
      dureeMs: command.dureeMs,
    });
    this.cache.signalerActivite(command.sessionId);

    await this.mastery.enregistrerTentative({
      studentKey: participant.studentKey,
      concept: question.concept,
      reussi: verdict.correcte,
      vueLe: new Date(),
    });

    return {
      ...verdict,
      libelleConfusion: libelleLisible(verdict.misconception),
    };
  }
}
