import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type { RapportSession } from '../domain/IFormationMailer.port';
import type { IIncidentsRepository } from '../domain/IIncidents.repository';
import type { IScoresRepository } from '../domain/IScores.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { agregerResultats } from '../domain/ResultatsSeance';
import type { ResultatsSeance } from '../domain/ResultatsSeance';
import { calculerStatistiquesSeance } from '../domain/SessionStatistics';
import type { StatistiquesSeance } from '../domain/SessionStatistics';
import { assertSessionOwnedBy } from '../domain/SessionOwnership';
import { buildRapportSession } from '../domain/SessionReport';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  INCIDENTS_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SCORES_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';

export type ResultatsDeSeance = RapportSession & {
  readonly resultats: ResultatsSeance;
  readonly statistiques: StatistiquesSeance;
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
    @Optional()
    @Inject(SCORES_REPOSITORY)
    private readonly scores?: IScoresRepository,
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

    const rapport = buildRapportSession({
      session,
      cours: await this.catalogue.trouver(
        session.courseSlug,
        session.courseVersion,
      ),
      participants: participantsListe,
      answers: reponses,
      incidents: incidentsListe,
      avertir: (message) => this.logger.warn(message),
    });
    const resultats = agregerResultats({
      questionIds: session.bareme.questions.map((question) => question.id),
      answers: reponses,
      participants: participantsListe.length,
    });
    const statistiques = calculerStatistiquesSeance(
      rapport.participants,
      resultats,
    );
    if (this.scores !== undefined) {
      await Promise.all([
        ...participantsListe.map((participant, index) => {
          const ligne = rapport.participants[index];
          return this.scores!.saveIndividual({
            sessionId,
            participantId: participant.id,
            score: ligne?.note ?? 0,
            percentage: ligne?.completion ?? 0,
          });
        }),
        this.scores.saveSession({ sessionId, ...statistiques }),
      ]);
    }
    return {
      ...rapport,
      resultats,
      statistiques,
    };
  }
}
