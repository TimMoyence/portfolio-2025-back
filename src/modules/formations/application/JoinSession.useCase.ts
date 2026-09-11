import { Inject, Injectable } from '@nestjs/common';
import { pickFreeSeed } from '../domain/Bareme';
import {
  SeedPoolExhaustedError,
  SessionClosedError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { SessionCode } from '../domain/SessionCode';
import { PARTICIPANTS_REPOSITORY, SESSIONS_REPOSITORY } from '../domain/token';
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
  ) {}

  async execute(command: JoinSessionCommand): Promise<JoinSessionResult> {
    const code = SessionCode.parse(command.code);
    const session = await this.sessions.findActiveByCode(code);
    if (!session) {
      throw new SessionNotFoundError(code);
    }
    if (session.etat === 'terminee') {
      throw new SessionClosedError();
    }

    const existant = await this.participants.findBySessionAndStudentKey(
      session.id,
      command.studentKey,
    );
    if (existant) {
      await this.participants.touch(existant.id);
      return this.toResult(existant.id, session, existant.seed);
    }

    const seedsPris = await this.participants.listSeedsBySession(session.id);
    const seed = pickFreeSeed(session.bareme, seedsPris);
    if (seed === null) {
      throw new SeedPoolExhaustedError();
    }

    const participant = await this.participants.create({
      sessionId: session.id,
      studentKey: command.studentKey,
      prenom: command.prenom,
      nom: command.nom,
      email: command.email,
      seed,
    });
    return this.toResult(participant.id, session, seed);
  }

  private toResult(
    participantId: string,
    session: {
      id: string;
      ecranCourant: number;
      modeRythme: JoinSessionResult['modeRythme'];
    },
    seed: number,
  ): JoinSessionResult {
    return {
      participantId,
      sessionId: session.id,
      seed,
      ecranCourant: session.ecranCourant,
      modeRythme: session.modeRythme,
    };
  }
}
