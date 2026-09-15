import { Inject, Injectable } from '@nestjs/common';
import type { DerouleCours } from '../domain/cours/DeroulePresentateur';
import { deroulePresentateur } from '../domain/cours/DeroulePresentateur';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { CoursInconnuError } from '../domain/errors/FormationErrors';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { assertSessionOwnedBy } from '../domain/SessionOwnership';
import { CATALOGUE_COURS, SESSIONS_REPOSITORY } from '../domain/token';

@Injectable()
export class LireDerouleUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(sessionId: string, teacherId: string): Promise<DerouleCours> {
    const session = assertSessionOwnedBy(
      await this.sessions.findById(sessionId),
      sessionId,
      teacherId,
    );
    const cours = this.catalogue.trouver(session.courseSlug);
    if (!cours) {
      throw new CoursInconnuError(session.courseSlug);
    }
    return deroulePresentateur(cours, session.bareme.graineReference);
  }
}
