import { Inject, Injectable } from '@nestjs/common';
import { rangDeLEcran } from '../domain/cours/EcranServi';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { EcranInconnuError } from '../domain/errors/FormationErrors';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import type {
  ITeacherAnnotationsRepository,
  TeacherAnnotationRecord,
} from '../domain/ITeacherAnnotations.repository';
import type { ActeurFormation } from '../domain/SessionOwnership';
import { texteRenseigne } from '../domain/TexteRenseigne';
import {
  CATALOGUE_COURS,
  SESSIONS_REPOSITORY,
  TEACHER_ANNOTATIONS_REPOSITORY,
} from '../domain/token';
import { coursDeLaSeance } from './CoursDeLaSeance';
import { seanceLisiblePar, seancePilotablePar } from './SessionAccess';

export interface AnnotationFormateur {
  readonly screenId: string;
  readonly note: string;
}

@Injectable()
export class ManageTeacherAnnotationsUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(TEACHER_ANNOTATIONS_REPOSITORY)
    private readonly annotations: ITeacherAnnotationsRepository,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async list(
    sessionId: string,
    acteur: ActeurFormation,
  ): Promise<readonly TeacherAnnotationRecord[]> {
    const session = await seanceLisiblePar(this.sessions, sessionId, acteur);
    return this.annotations.listBySession(sessionId, session.teacherId);
  }

  async save(
    sessionId: string,
    teacherId: string,
    annotation: AnnotationFormateur,
  ): Promise<TeacherAnnotationRecord> {
    const note = texteRenseigne(annotation.note, 'La note');
    const session = await seancePilotablePar(
      this.sessions,
      sessionId,
      teacherId,
    );
    const cours = await coursDeLaSeance(this.catalogue, session);
    if (rangDeLEcran(cours, annotation.screenId) < 0) {
      throw new EcranInconnuError(annotation.screenId);
    }
    return this.annotations.save({
      sessionId,
      teacherId,
      screenId: annotation.screenId,
      note,
    });
  }
}
