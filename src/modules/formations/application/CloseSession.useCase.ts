import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import { SessionClosedError } from '../domain/errors/FormationErrors';
import type {
  IFormationMailer,
  RapportSession,
} from '../domain/IFormationMailer.port';
import type { IIncidentsRepository } from '../domain/IIncidents.repository';
import type {
  IParticipantsRepository,
  ParticipantRecord,
} from '../domain/IParticipants.repository';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { assertSessionOwnedBy } from '../domain/SessionOwnership';
import { buildRapportSession } from '../domain/SessionReport';
import {
  ANSWERS_REPOSITORY,
  FORMATION_MAILER,
  INCIDENTS_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';

const REVIEW_BASE_URL_PAR_DEFAUT = 'https://asilidesign.fr/cours/revision';
const REVIEW_TOKEN_SECRET_LONGUEUR_MIN = 32;

@Injectable()
export class CloseSessionUseCase {
  private readonly logger = new Logger(CloseSessionUseCase.name);

  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(ANSWERS_REPOSITORY)
    private readonly answers: IAnswersRepository,
    @Inject(INCIDENTS_REPOSITORY)
    private readonly incidents: IIncidentsRepository,
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

    const [participantsListe, reponses, incidentsListe] = await Promise.all([
      this.participants.listBySession(sessionId),
      this.answers.listBySession(sessionId),
      this.incidents.listBySession(sessionId),
    ]);

    const rapport = buildRapportSession({
      session: misAJour,
      participants: participantsListe,
      answers: reponses,
      incidents: incidentsListe,
    });

    this.envoyerSynthese(
      this.resolveDestinataireFormateur(destinataireFormateur),
      rapport,
    );
    this.envoyerCopies(sessionId, participantsListe, rapport);
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
    let secret: string;
    try {
      secret = this.resolveReviewTokenSecret();
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
      const lien = this.lienRevisionPour(sessionId, participant, secret);
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

  /**
   * RFC 2104 section 3 recommande une cle HMAC au moins aussi longue que le
   * digest (32 octets pour SHA-256) : une cle vide ou trop courte affaiblit
   * la protection, ici sur une entree deja publique (le `sessionId` figure
   * dans l'URL du flux temps reel, le `participantId` est connu de
   * l'etudiant). Refuser de produire un jeton est donc la seule option sure.
   */
  private resolveReviewTokenSecret(): string {
    const secret = process.env.FORMATION_REVIEW_TOKEN_SECRET;
    if (!secret || secret.length < REVIEW_TOKEN_SECRET_LONGUEUR_MIN) {
      throw new Error(
        `FORMATION_REVIEW_TOKEN_SECRET doit etre configure avec au moins ${REVIEW_TOKEN_SECRET_LONGUEUR_MIN} caracteres`,
      );
    }
    return secret;
  }

  private lienRevisionPour(
    sessionId: string,
    participant: ParticipantRecord,
    secret: string,
  ): string {
    const base =
      process.env.FORMATION_REVIEW_BASE_URL?.trim() ||
      REVIEW_BASE_URL_PAR_DEFAUT;
    const jeton = createHmac('sha256', secret)
      .update(`${sessionId}:${participant.id}`)
      .digest('hex');
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
