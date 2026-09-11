import { Inject, Injectable } from '@nestjs/common';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type { RapportSession } from '../domain/IFormationMailer.port';
import type { IIncidentsRepository } from '../domain/IIncidents.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { assertSessionOwnedBy } from '../domain/SessionOwnership';
import { buildRapportSession } from '../domain/SessionReport';
import {
  ANSWERS_REPOSITORY,
  INCIDENTS_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';

@Injectable()
export class GetSessionResultsUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(ANSWERS_REPOSITORY)
    private readonly answers: IAnswersRepository,
    @Inject(INCIDENTS_REPOSITORY)
    private readonly incidents: IIncidentsRepository,
  ) {}

  async execute(sessionId: string, teacherId: string): Promise<RapportSession> {
    const session = assertSessionOwnedBy(
      await this.sessions.findById(sessionId),
      sessionId,
      teacherId,
    );

    const [participantsListe, reponses, incidentsListe] = await Promise.all([
      this.participants.listBySession(sessionId),
      this.answers.listBySession(sessionId),
      this.incidents.listBySession(sessionId),
    ]);

    return buildRapportSession({
      session,
      participants: participantsListe,
      answers: reponses,
      incidents: incidentsListe,
    });
  }
}
