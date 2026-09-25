import { Injectable } from '@nestjs/common';
import type { DerouleCours } from '../domain/cours/DeroulePresentateur';
import { deroulePresentateur } from '../domain/cours/DeroulePresentateur';
import type { ActeurFormation } from '../domain/SessionOwnership';
import { LectureDeSeance } from './LectureDeSeance';

@Injectable()
export class LireDerouleUseCase {
  constructor(private readonly lecture: LectureDeSeance) {}

  async execute(
    sessionId: string,
    acteur: ActeurFormation,
  ): Promise<DerouleCours> {
    const { session, cours } = await this.lecture.coursLisiblePar(
      sessionId,
      acteur,
    );
    return deroulePresentateur(cours, session.bareme.graineReference);
  }
}
