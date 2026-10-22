import { Inject, Injectable } from '@nestjs/common';
import type { Cours, Ecran } from '../domain/contrats/cours';
import { planServi } from '../domain/cours/EcranServi';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import type {
  IParticipantsRepository,
  ParticipantRecord,
} from '../domain/IParticipants.repository';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import { ParticipantNotFoundError } from '../domain/errors/FormationErrors';
import {
  CATALOGUE_COURS,
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';
import {
  coursDeLaSeance,
  ecranOuvertAuxProductions,
  seanceExistante,
  seanceOuverteAuxReponses,
} from './CoursDeLaSeance';

export interface CibleDuParticipant {
  readonly sessionId: string;
  readonly participantId: string;
}

@Injectable()
export class ParticipationEnSeance {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    readonly participants: IParticipantsRepository,
    @Inject(CATALOGUE_COURS)
    readonly catalogue: ICatalogueCours,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
  ) {}

  async ouverte({ sessionId }: Pick<CibleDuParticipant, 'sessionId'>): Promise<{
    session: SessionRecord;
    cours: Cours;
  }> {
    const session = await seanceOuverteAuxReponses(this.sessions, sessionId);
    return { session, cours: await coursDeLaSeance(this.catalogue, session) };
  }

  async planDeLaSeance<P>(
    cible: CibleDuParticipant & { readonly planId: string },
    planDe: (ecran: Ecran) => P | null,
    nature: string,
  ): Promise<P> {
    const { session, cours } = await this.ouverte(cible);
    return planServi(session, cours, cible.planId, planDe, nature);
  }

  async cibleOuverteAuxProductions<
    T extends { readonly rang: number; readonly ecran: Ecran },
  >(
    sessionId: string,
    cible: {
      readonly id: string;
      readonly trouver: (cours: Cours, id: string) => T | null;
    },
    absente: (id: string) => Error,
  ): Promise<{ session: SessionRecord; cible: T }> {
    const { session, cours } = await this.ouverte({ sessionId });
    return {
      session,
      cible: ecranOuvertAuxProductions(
        session,
        cours,
        { valeur: cible.trouver(cours, cible.id), id: cible.id },
        absente,
      ),
    };
  }

  async participant({
    participantId,
  }: Pick<CibleDuParticipant, 'participantId'>): Promise<ParticipantRecord> {
    const participant = await this.participants.findById(participantId);
    if (participant === null) {
      throw new ParticipantNotFoundError(participantId);
    }
    return participant;
  }

  async contexte(cible: CibleDuParticipant): Promise<{
    session: SessionRecord;
    participant: ParticipantRecord;
    cours: Cours;
  }> {
    const session = await seanceExistante(this.sessions, cible.sessionId);
    const participant = await this.participant(cible);
    const cours = await coursDeLaSeance(this.catalogue, session);
    return { session, participant, cours };
  }

  signalerActivite(sessionId: string): void {
    this.cache.signalerActivite(sessionId);
  }
}
