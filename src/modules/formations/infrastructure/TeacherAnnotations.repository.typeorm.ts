import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  ITeacherAnnotationsRepository,
  SaveTeacherAnnotationInput,
  TeacherAnnotationRecord,
} from '../domain/ITeacherAnnotations.repository';
import { FormationTeacherAnnotationEntity } from './entities/FormationTeacherAnnotation.entity';

const CLE_ANNOTATION = ['sessionId', 'screenId', 'groupName'];
const PORTEE_CLASSE_ENTIERE = 'Classe entière';

@Injectable()
export class TeacherAnnotationsRepositoryTypeORM implements ITeacherAnnotationsRepository {
  constructor(
    @InjectRepository(FormationTeacherAnnotationEntity)
    private readonly repo: Repository<FormationTeacherAnnotationEntity>,
  ) {}

  async save(
    input: SaveTeacherAnnotationInput,
  ): Promise<TeacherAnnotationRecord> {
    await this.repo.upsert(
      {
        sessionId: input.sessionId,
        teacherId: input.teacherId,
        screenId: input.screenId,
        groupName: PORTEE_CLASSE_ENTIERE,
        note: input.note,
        updatedAt: new Date(),
      },
      CLE_ANNOTATION,
    );
    return this.toDomain(
      await this.repo.findOneByOrFail({
        sessionId: input.sessionId,
        screenId: input.screenId,
        groupName: PORTEE_CLASSE_ENTIERE,
      }),
    );
  }

  async listBySession(
    sessionId: string,
    teacherId: string,
  ): Promise<readonly TeacherAnnotationRecord[]> {
    const rows = await this.repo.find({
      where: { sessionId, teacherId, groupName: PORTEE_CLASSE_ENTIERE },
      order: { screenId: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(
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
