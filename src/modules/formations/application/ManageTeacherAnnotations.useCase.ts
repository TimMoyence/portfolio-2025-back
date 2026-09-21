import { Inject, Injectable } from '@nestjs/common';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import type {
  ITeacherAnnotationsRepository,
  TeacherAnnotationRecord,
} from '../domain/ITeacherAnnotations.repository';
import type { ActeurFormation } from '../domain/SessionOwnership';
import { texteRenseigne } from '../domain/TexteRenseigne';
import {
  SESSIONS_REPOSITORY,
  TEACHER_ANNOTATIONS_REPOSITORY,
} from '../domain/token';
import { seanceLisiblePar, seancePilotablePar } from './SessionAccess';

export interface AnnotationFormateur {
  readonly screenId: string;
  readonly groupName: string;
  readonly note: string;
}

@Injectable()
export class ManageTeacherAnnotationsUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(TEACHER_ANNOTATIONS_REPOSITORY)
    private readonly annotations: ITeacherAnnotationsRepository,
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
    const groupName = texteRenseigne(annotation.groupName, 'Le groupe');
    const note = texteRenseigne(annotation.note, 'La note');
    await seancePilotablePar(this.sessions, sessionId, teacherId);
    return this.annotations.save({
      sessionId,
      teacherId,
      screenId: annotation.screenId,
      groupName,
      note,
    });
  }
}
