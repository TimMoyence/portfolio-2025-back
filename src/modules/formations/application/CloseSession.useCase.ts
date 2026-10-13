import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  IFormationMailer,
  RapportSession,
} from '../domain/IFormationMailer.port';
import type { ParticipantRecord } from '../domain/IParticipants.repository';
import type { IScoresRepository } from '../domain/IScores.repository';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import {
  FORMATION_MAILER,
  SCORES_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';
import { messageDErreur } from '../../../common/domain/errors/message-d-erreur';
import { GetSessionResultsUseCase } from './GetSessionResults.useCase';
import type { BilanDeSeance } from './GetSessionResults.useCase';
import { seanceNonTermineePilotablePar } from './SessionAccess';

@Injectable()
export class CloseSessionUseCase {
  private readonly logger = new Logger(CloseSessionUseCase.name);

  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    private readonly results: GetSessionResultsUseCase,
    @Inject(SCORES_REPOSITORY)
    private readonly scores: IScoresRepository,
    @Inject(FORMATION_MAILER)
    private readonly mailer: IFormationMailer,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
  ) {}

  async execute(
    sessionId: string,
    teacherId: string,
    destinataireFormateur?: string,
  ): Promise<void> {
    await seanceNonTermineePilotablePar(this.sessions, sessionId, teacherId);

    const misAJour = await this.sessions.update(sessionId, {
      etat: 'terminee',
      fermeeLe: new Date(),
    });

    this.cache.drop(sessionId);

    const bilan = await this.results.bilanDe(misAJour);
    await this.enregistrerScores(sessionId, bilan);

    this.envoyerSynthese(
      this.resolveDestinataireFormateur(destinataireFormateur),
      bilan.resultats,
    );
    this.envoyerCopies(bilan.participants, bilan.resultats);
  }

  private async enregistrerScores(
    sessionId: string,
    { participants, resultats }: BilanDeSeance,
  ): Promise<void> {
    await Promise.all([
      this.scores.saveIndividuals(
        participants.map((participant, rang) => ({
          sessionId,
          participantId: participant.id,
          note: resultats.participants[rang].note,
          completion: resultats.participants[rang].completion,
        })),
      ),
      this.scores.saveSession({ sessionId, ...resultats.statistiques }),
    ]);
  }

  /**
   * Ruling 54 : ordre de resolution du destinataire de la synthese
   * formateur — l'argument explicite en priorite, sinon
   * FORMATION_TEACHER_NOTIFICATION_TO, jamais teacherId. teacherId est
   * traite partout ailleurs dans le module comme un identifiant opaque
   * (cf. ControlSession.useCase.ts), pas comme une adresse email.
   */
  private resolveDestinataireFormateur(
    destinataireFormateur: string | undefined,
  ): string {
    return (
      destinataireFormateur ??
      process.env.FORMATION_TEACHER_NOTIFICATION_TO ??
      ''
    );
  }

  private envoyerSynthese(destinataire: string, rapport: RapportSession): void {
    this.mailer
      .sendSyntheseFormateur(destinataire, rapport)
      .catch((error: unknown) => {
        this.logger.warn(
          `Envoi de la synthese formateur echoue pour ${destinataire}: ${messageDErreur(error)}`,
        );
      });
  }

  private envoyerCopies(
    participantsListe: readonly ParticipantRecord[],
    rapport: RapportSession,
  ): void {
    participantsListe.forEach((participant, index) => {
      const rapportParticipant = rapport.participants[index];
      if (!rapportParticipant) {
        return;
      }
      this.mailer
        .sendCopieEtudiant({
          courseSlug: rapport.courseSlug,
          code: rapport.code,
          participant: rapportParticipant,
        })
        .catch((error: unknown) => {
          this.logger.warn(
            `Envoi de la copie echoue pour ${participant.email}: ${messageDErreur(error)}`,
          );
        });
    });
  }
}
