import { Injectable } from '@nestjs/common';
import type { DerouleCours } from '../../../domain/cours/diffusion/DeroulePresentateur';
import { deroulePresentateur } from '../../../domain/cours/diffusion/DeroulePresentateur';
import type { ActeurFormation } from '../../../domain/seance/acces/SessionOwnership';
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
