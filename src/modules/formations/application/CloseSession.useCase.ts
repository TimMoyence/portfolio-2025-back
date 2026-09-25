import { Inject, Injectable, Logger } from '@nestjs/common';
import { SessionClosedError } from '../domain/errors/FormationErrors';
import type {
  IFormationMailer,
  RapportSession,
} from '../domain/IFormationMailer.port';
import type { ParticipantRecord } from '../domain/IParticipants.repository';
import type { IScoresRepository } from '../domain/IScores.repository';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { assertSessionOwnedBy } from '../domain/SessionOwnership';
import {
  FORMATION_MAILER,
  SCORES_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';
import { GetSessionResultsUseCase } from './GetSessionResults.useCase';
import type { BilanDeSeance } from './GetSessionResults.useCase';
import { secretDeSignature, signer } from './SignatureFormations';

const REVIEW_BASE_URL_PAR_DEFAUT = 'https://asilidesign.fr/cours/revision';

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
    const session = assertSessionOwnedBy(
      await this.sessions.findById(sessionId),
      sessionId,
      teacherId,
    );
    if (session.etat === 'terminee') {
      throw new SessionClosedError();
    }

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
    this.envoyerCopies(sessionId, bilan.participants, bilan.resultats);
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
          `Envoi de la synthese formateur echoue pour ${destinataire}: ${describe(error)}`,
        );
      });
  }

  private envoyerCopies(
    sessionId: string,
    participantsListe: readonly ParticipantRecord[],
    rapport: RapportSession,
  ): void {
    try {
      secretDeSignature();
    } catch (error) {
      this.logger.error(
        `Envoi des copies etudiantes annule, aucun jeton ne peut etre produit: ${describe(error)}`,
      );
      return;
    }

    participantsListe.forEach((participant, index) => {
      const rapportParticipant = rapport.participants[index];
      if (!rapportParticipant) {
        return;
      }
      const lien = this.lienRevisionPour(sessionId, participant);
      this.mailer
        .sendCopieEtudiant({
          courseSlug: rapport.courseSlug,
          code: rapport.code,
          participant: rapportParticipant,
          lienRevision: lien,
        })
        .catch((error: unknown) => {
          this.logger.warn(
            `Envoi de la copie echoue pour ${participant.email}: ${describe(error)}`,
          );
        });
    });
  }

  private lienRevisionPour(
    sessionId: string,
    participant: ParticipantRecord,
  ): string {
    const base =
      process.env.FORMATION_REVIEW_BASE_URL?.trim() ||
      REVIEW_BASE_URL_PAR_DEFAUT;
    const jeton = signer(`${sessionId}:${participant.id}`);
    try {
      const url = new URL(base);
      url.searchParams.set('session', sessionId);
      url.searchParams.set('participant', participant.id);
      url.searchParams.set('token', jeton);
      return url.toString();
    } catch {
      return `${base}?session=${sessionId}&participant=${participant.id}&token=${jeton}`;
    }
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
