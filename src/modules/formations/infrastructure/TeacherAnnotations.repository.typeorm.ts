import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  ITeacherAnnotationsRepository,
  SaveTeacherAnnotationInput,
  TeacherAnnotationRecord,
} from '../domain/ITeacherAnnotations.repository';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { FormationTeacherAnnotationEntity } from './entities/FormationTeacherAnnotation.entity';

const CLE_ANNOTATION = ['sessionId', 'screenId'];

@Injectable()
export class TeacherAnnotationsRepositoryTypeORM
  extends DepotEnDomaine<
    FormationTeacherAnnotationEntity,
    TeacherAnnotationRecord
  >
  implements ITeacherAnnotationsRepository
{
  constructor(
    @InjectRepository(FormationTeacherAnnotationEntity)
    repo: Repository<FormationTeacherAnnotationEntity>,
  ) {
    super(repo);
  }

  async save(
    input: SaveTeacherAnnotationInput,
  ): Promise<TeacherAnnotationRecord> {
    await this.repo.upsert(
      {
        sessionId: input.sessionId,
        teacherId: input.teacherId,
        screenId: input.screenId,
        note: input.note,
        updatedAt: new Date(),
      },
      CLE_ANNOTATION,
    );
    return this.toDomain(
      await this.repo.findOneByOrFail({
        sessionId: input.sessionId,
        screenId: input.screenId,
      }),
    );
  }

  listBySession(
    sessionId: string,
    teacherId: string,
  ): Promise<readonly TeacherAnnotationRecord[]> {
    return this.lister({
      where: { sessionId, teacherId },
      order: { screenId: 'ASC' },
    });
  }

  protected toDomain(
    row: FormationTeacherAnnotationEntity,
  ): TeacherAnnotationRecord {
    return {
      id: row.id,
      sessionId: row.sessionId,
      teacherId: row.teacherId,
      screenId: row.screenId,
      note: row.note,
      updatedAt: row.updatedAt,
    };
  }
}
