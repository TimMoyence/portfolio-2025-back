import { Inject, Injectable } from '@nestjs/common';
import type { Cours } from '../domain/contrats/cours';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import type { ActeurFormation } from '../domain/SessionOwnership';
import { CATALOGUE_COURS, SESSIONS_REPOSITORY } from '../domain/token';
import { coursDeLaSeance } from './CoursDeLaSeance';
import { seanceLisiblePar } from './SessionAccess';

@Injectable()
export class LectureDeSeance {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    readonly sessions: ISessionsRepository,
    @Inject(CATALOGUE_COURS)
    readonly catalogue: ICatalogueCours,
  ) {}

  async coursLisiblePar(
    sessionId: string,
    acteur: ActeurFormation,
  ): Promise<{ session: SessionRecord; cours: Cours }> {
    const session = await seanceLisiblePar(this.sessions, sessionId, acteur);
    return { session, cours: await coursDeLaSeance(this.catalogue, session) };
  }
}
