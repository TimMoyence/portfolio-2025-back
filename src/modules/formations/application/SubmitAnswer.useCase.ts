import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { gradeAnswer } from '../domain/AnswerGrading';
import { estValeurConnue, findQuestion, solutionFor } from '../domain/Bareme';
import { libelleDeConfusion } from '../domain/cours/banque/confusions';
import { assertEcranServi, rangDeLaQuestion } from '../domain/cours/EcranServi';
import { assertPhaseOuverte } from '../domain/cours/PilotageEcrans';
import {
  AnswerAlreadySubmittedError,
  CoursInconnuError,
  ParticipantNotFoundError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type { IMasteryRepository } from '../domain/IMastery.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { assertReponsesOuvertes } from '../domain/SessionState';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';
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
export class SubmitAnswerUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(ANSWERS_REPOSITORY)
    private readonly answers: IAnswersRepository,
    @Inject(MASTERY_REPOSITORY)
    private readonly mastery: IMasteryRepository,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(command: SubmitAnswerCommand): Promise<SubmitAnswerResult> {
    const session = await this.sessions.findById(command.sessionId);
    if (!session) {
      throw new SessionNotFoundError(command.sessionId);
    }
    assertReponsesOuvertes(session.etat);

    const deja = await this.answers.existsFor(
      command.participantId,
      command.questionId,
    );
    if (deja) {
      throw new AnswerAlreadySubmittedError(command.questionId);
    }

    const participant = await this.participants.findById(command.participantId);
    if (!participant || participant.evinceLe !== null) {
      throw new ParticipantNotFoundError(command.participantId);
    }

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
    const cours = await this.catalogue.trouver(
      session.courseSlug,
      session.courseVersion,
    );
    if (!cours) {
      throw new CoursInconnuError(session.courseSlug);
    }
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
      libelleConfusion: verdict.misconception
        ? (libelleDeConfusion(verdict.misconception) ?? verdict.misconception)
        : null,
    };
  }
}
