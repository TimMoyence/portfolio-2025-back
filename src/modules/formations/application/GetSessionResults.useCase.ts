import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type { RapportSession } from '../domain/IFormationMailer.port';
import type { IIncidentsRepository } from '../domain/IIncidents.repository';
import type {
  IParticipantsRepository,
  ParticipantRecord,
} from '../domain/IParticipants.repository';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import { REGLE_DE_NOTATION } from '../domain/RegleDeNotation';
import type { RegleDeNotation } from '../domain/RegleDeNotation';
import { agregerResultats } from '../domain/ResultatsSeance';
import type { ResultatsSeance } from '../domain/ResultatsSeance';
import { calculerStatistiquesSeance } from '../domain/SessionStatistics';
import type { StatistiquesSeance } from '../domain/SessionStatistics';
import type { ActeurFormation } from '../domain/SessionOwnership';
import { buildRapportSession } from '../domain/SessionReport';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  INCIDENTS_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';
import { seanceLisiblePar } from './SessionAccess';

export type ResultatsDeSeance = RapportSession & {
  readonly resultats: ResultatsSeance;
  readonly statistiques: StatistiquesSeance;
  readonly notation: RegleDeNotation;
};

export interface BilanDeSeance {
  readonly participants: readonly ParticipantRecord[];
  readonly resultats: ResultatsDeSeance;
}

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
    acteur: ActeurFormation,
  ): Promise<ResultatsDeSeance> {
    const session = await seanceLisiblePar(this.sessions, sessionId, acteur);
    return (await this.bilanDe(session)).resultats;
  }

  async bilanDe(session: SessionRecord): Promise<BilanDeSeance> {
    const [participantsListe, reponses, incidentsListe] = await Promise.all([
      this.participants.listBySession(session.id),
      this.answers.listBySession(session.id),
      this.incidents.listBySession(session.id),
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
    return {
      participants: participantsListe,
      resultats: {
        ...rapport,
        resultats,
        statistiques: calculerStatistiquesSeance(
          rapport.participants,
          resultats,
        ),
        notation: REGLE_DE_NOTATION,
      },
    };
  }
}
