import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { gradeAnswer } from '../domain/AnswerGrading';
import { estValeurConnue, findQuestion, solutionFor } from '../domain/Bareme';
import {
  AnswerAlreadySubmittedError,
  ParticipantNotFoundError,
  SessionClosedError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type { IMasteryRepository } from '../domain/IMastery.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { nextBox } from '../domain/LeitnerBox';
import type { Boite } from '../domain/LeitnerBox';
import {
  ANSWERS_REPOSITORY,
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';
import type {
  SubmitAnswerCommand,
  SubmitAnswerResult,
} from './dto/SubmitAnswer.command';

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
  ) {}

  async execute(command: SubmitAnswerCommand): Promise<SubmitAnswerResult> {
    const session = await this.sessions.findById(command.sessionId);
    if (!session) {
      throw new SessionNotFoundError(command.sessionId);
    }
    if (session.etat === 'terminee') {
      throw new SessionClosedError();
    }

    const deja = await this.answers.existsFor(
      command.participantId,
      command.questionId,
    );
    if (deja) {
      throw new AnswerAlreadySubmittedError(command.questionId);
    }

    const participant = await this.participants.findById(command.participantId);
    if (!participant) {
      throw new ParticipantNotFoundError(command.participantId);
    }

    const question = findQuestion(session.bareme, command.questionId);
    if (!question) {
      throw new DomainValidationError(
        `Question absente du bareme: ${command.questionId}`,
      );
    }

    const solution = solutionFor(
      session.bareme,
      participant.seed,
      command.questionId,
    );
    if (!solution) {
      throw new DomainValidationError(
        `Aucune solution pour le tirage ${participant.seed}`,
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

    await this.updateMastery(
      participant.studentKey,
      question.concept,
      verdict.correcte,
    );

    return verdict;
  }

  private async updateMastery(
    studentKey: string,
    concept: string,
    reussi: boolean,
  ): Promise<void> {
    const existants = await this.mastery.findByStudentKey(studentKey);
    const courant = existants.find((entree) => entree.concept === concept);
    const boite: Boite = courant ? courant.boite : 1;
    await this.mastery.upsert({
      studentKey,
      concept,
      boite: nextBox(boite, reussi),
      derniereVue: new Date(),
      succes: (courant?.succes ?? 0) + (reussi ? 1 : 0),
      echecs: (courant?.echecs ?? 0) + (reussi ? 0 : 1),
    });
  }
}
