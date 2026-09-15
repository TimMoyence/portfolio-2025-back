import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type { RapportSession } from '../domain/IFormationMailer.port';
import type { IIncidentsRepository } from '../domain/IIncidents.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { agregerResultats } from '../domain/ResultatsSeance';
import type { ResultatsSeance } from '../domain/ResultatsSeance';
import { assertSessionOwnedBy } from '../domain/SessionOwnership';
import { buildRapportSession } from '../domain/SessionReport';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  INCIDENTS_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';

export type ResultatsDeSeance = RapportSession & {
  readonly resultats: ResultatsSeance;
};

@Injectable()
export class GetSessionResultsUseCase {
  private readonly logger = new Logger(GetSessionResultsUseCase.name);

  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(ANSWERS_REPOSITORY)
    private readonly answers: IAnswersRepository,
    @Inject(INCIDENTS_REPOSITORY)
    private readonly incidents: IIncidentsRepository,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(
    sessionId: string,
    teacherId: string,
  ): Promise<ResultatsDeSeance> {
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

    return {
      ...buildRapportSession({
        session,
        cours: this.catalogue.trouver(session.courseSlug),
        participants: participantsListe,
        answers: reponses,
        incidents: incidentsListe,
        avertir: (message) => this.logger.warn(message),
      }),
      resultats: agregerResultats({
        questionIds: session.bareme.questions.map((question) => question.id),
        answers: reponses,
        participants: participantsListe.length,
      }),
    };
  }
}
