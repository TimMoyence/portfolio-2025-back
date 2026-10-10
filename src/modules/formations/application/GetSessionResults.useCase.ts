import { Inject, Injectable, Logger } from '@nestjs/common';
import { questionsAAgreger, resumeDuBareme } from '../domain/Bareme';
import type { ResultatsDeSeance } from '../domain/contrats/resultats';
import { agregerEnigmes } from '../domain/cours/Enigmes';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import type { ClasseurTelecharge } from '../domain/IClasseursDeCours.port';
import type { IEscapeRepository } from '../domain/IEscape.repository';
import type { IFreeResponsesRepository } from '../domain/IFreeResponses.repository';
import type { IPulsesRepository } from '../domain/IPulses.repository';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type { IIncidentsRepository } from '../domain/IIncidents.repository';
import type {
  IParticipantsRepository,
  ParticipantRecord,
} from '../domain/IParticipants.repository';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import { rapportEnCsv } from '../domain/RapportCsv';
import { REGLE_DE_NOTATION } from '../domain/RegleDeNotation';
import { agregerResultats } from '../domain/ResultatsSeance';
import { calculerStatistiquesSeance } from '../domain/SessionStatistics';
import type { ActeurFormation } from '../domain/SessionOwnership';
import { buildRapportSession } from '../domain/SessionReport';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  ESCAPE_REPOSITORY,
  FREE_RESPONSES_REPOSITORY,
  INCIDENTS_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  PULSES_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';
import { seanceLisiblePar } from './SessionAccess';

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
    @Inject(PULSES_REPOSITORY)
    private readonly pulses: IPulsesRepository,
    @Inject(ESCAPE_REPOSITORY)
    private readonly escape: IEscapeRepository,
    @Inject(FREE_RESPONSES_REPOSITORY)
    private readonly reponsesLibres: IFreeResponsesRepository,
  ) {}

  async execute(
    sessionId: string,
    acteur: ActeurFormation,
  ): Promise<ResultatsDeSeance> {
    const session = await seanceLisiblePar(this.sessions, sessionId, acteur);
    return (await this.bilanDe(session)).resultats;
  }

  async exporterEnCsv(
    sessionId: string,
    acteur: ActeurFormation,
  ): Promise<ClasseurTelecharge> {
    return rapportEnCsv(await this.execute(sessionId, acteur));
  }

  async bilanDe(
    session: SessionRecord,
    options: { readonly sansReponsesLibres?: boolean } = {},
  ): Promise<BilanDeSeance> {
    const [
      participantsListe,
      reponses,
      incidentsListe,
      jalons,
      progressions,
      reponsesLibres,
    ] = await Promise.all([
      this.participants.listBySession(session.id),
      this.answers.listBySession(session.id),
      this.incidents.listBySession(session.id),
      this.pulses.compterParSondage(session.id),
      this.escape.listerProgressionDeSeance(session.id),
      options.sansReponsesLibres
        ? []
        : this.reponsesLibres.listBySession(session.id),
    ]);
    const cours = await this.catalogue.trouver(
      session.courseSlug,
      session.courseVersion,
    );
    const rapport = buildRapportSession({
      session,
      cours,
      participants: participantsListe,
      answers: reponses,
      incidents: incidentsListe,
      reponsesLibres,
      avertir: (message) => this.logger.warn(message),
    });
    const resultats = agregerResultats({
      questions: questionsAAgreger(session.bareme, cours),
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
        bareme: resumeDuBareme(session.bareme),
        jalons,
        enigmes: agregerEnigmes(progressions),
      },
    };
  }
}
