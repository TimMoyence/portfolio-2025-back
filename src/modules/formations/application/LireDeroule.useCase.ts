import { Inject, Injectable } from '@nestjs/common';
import type { DerouleCours } from '../domain/cours/DeroulePresentateur';
import { deroulePresentateur } from '../domain/cours/DeroulePresentateur';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import type { ActeurFormation } from '../domain/SessionOwnership';
import { CATALOGUE_COURS, SESSIONS_REPOSITORY } from '../domain/token';
import { coursDeLaSeance } from './CoursDeLaSeance';
import { seanceLisiblePar } from './SessionAccess';

@Injectable()
export class LireDerouleUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(
    sessionId: string,
    acteur: ActeurFormation,
  ): Promise<DerouleCours> {
    const session = await seanceLisiblePar(this.sessions, sessionId, acteur);
    const cours = await coursDeLaSeance(this.catalogue, session);
    return deroulePresentateur(cours, session.bareme.graineReference);
  }
}
