import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  ITeacherAnnotationsRepository,
  SaveTeacherAnnotationInput,
  TeacherAnnotationRecord,
} from '../domain/ITeacherAnnotations.repository';
import { FormationTeacherAnnotationEntity } from './entities/FormationTeacherAnnotation.entity';

@Injectable()
export class TeacherAnnotationsRepositoryTypeORM implements ITeacherAnnotationsRepository {
  constructor(
    @InjectRepository(FormationTeacherAnnotationEntity)
    private readonly repo: Repository<FormationTeacherAnnotationEntity>,
  ) {}

  async save(
    input: SaveTeacherAnnotationInput,
  ): Promise<TeacherAnnotationRecord> {
    const existing = await this.repo.findOne({
      where: {
        sessionId: input.sessionId,
        screenId: input.screenId,
        groupName: input.groupName,
      },
    });
    const entity = this.repo.create({
      ...existing,
      ...input,
      updatedAt: new Date(),
    });
    return this.toDomain(await this.repo.save(entity));
  }

  async listBySession(
    sessionId: string,
    teacherId: string,
  ): Promise<readonly TeacherAnnotationRecord[]> {
    const rows = await this.repo.find({
      where: { sessionId, teacherId },
      order: { screenId: 'ASC', groupName: 'ASC' },
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
      groupName: row.groupName,
      note: row.note,
      updatedAt: row.updatedAt,
    };
  }
}
