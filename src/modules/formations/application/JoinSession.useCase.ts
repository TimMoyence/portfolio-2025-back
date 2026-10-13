import { Inject, Injectable } from '@nestjs/common';
import { pickFreeSeed } from '../domain/Bareme';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { SecretDeReprise } from '../domain/SecretDeReprise';
import { SessionCode } from '../domain/SessionCode';
import { assertSeanceTrouvee } from '../domain/SessionOwnership';
import { assertSeanceNonTerminee } from '../domain/SessionState';
import {
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';
import type {
  JoinSessionCommand,
  JoinSessionResult,
} from './dto/JoinSession.command';

@Injectable()
export class JoinSessionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
  ) {}

  async execute(command: JoinSessionCommand): Promise<JoinSessionResult> {
    const code = SessionCode.parse(command.code);
    const session = assertSeanceTrouvee(
      await this.sessions.findActiveByCode(code),
      code,
    );
    assertSeanceNonTerminee(session.etat);

    const secretDeReprise = SecretDeReprise.generer();
    const { participant, nouveau } = await this.participants.inscrire({
      sessionId: session.id,
      studentKey: command.studentKey,
      prenom: command.prenom,
      nom: command.nom,
      email: command.email,
      capacite: session.capacite,
      empreinteDeReprise: SecretDeReprise.empreinte(secretDeReprise),
      repriseAutorisee: (empreinteStockee) =>
        SecretDeReprise.autorise(empreinteStockee, command.secretDeReprise),
      choisirGraine: (prises) => pickFreeSeed(session.bareme, prises),
    });

    if (nouveau) {
      this.cache.signalerActivite(session.id);
    } else {
      await this.participants.touch(participant.id);
    }

    return {
      participantId: participant.id,
      generationDeJeton: participant.generationDeJeton,
      sessionId: session.id,
      secretDeReprise,
      seed: participant.seed,
      ecranCourant: session.ecranCourant,
      modeRythme: session.modeRythme,
    };
  }
}
