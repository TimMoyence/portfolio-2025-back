import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import type {
  CreateSessionInput,
  ISessionsRepository,
  SessionRecord,
  UpdateSessionInput,
} from '../domain/ISessions.repository';
import { FormationSessionEntity } from './entities/FormationSession.entity';

@Injectable()
export class SessionsRepositoryTypeORM implements ISessionsRepository {
  constructor(
    @InjectRepository(FormationSessionEntity)
    private readonly repo: Repository<FormationSessionEntity>,
  ) {}

  async create(input: CreateSessionInput): Promise<SessionRecord> {
    const entity = this.repo.create({
      courseSlug: input.courseSlug,
      teacherId: input.teacherId,
      code: input.code,
      bareme: input.bareme,
      etat: 'attente',
      modeRythme: 'pilote',
      ecranCourant: 0,
      intervalleLibre: null,
      fermeeLe: null,
      majLe: new Date(),
    });
    return this.toDomain(await this.repo.save(entity));
  }

  async findById(id: string): Promise<SessionRecord | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findActiveByCode(code: string): Promise<SessionRecord | null> {
    const entity = await this.repo.findOne({
      where: { code, etat: Not('terminee') },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async isCodeTaken(code: string): Promise<boolean> {
    const total = await this.repo.count({
      where: { code, etat: Not('terminee') },
    });
    return total > 0;
  }

  async update(id: string, input: UpdateSessionInput): Promise<SessionRecord> {
    await this.repo.update(id, { ...input, majLe: new Date() });
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new Error(`Session introuvable apres mise a jour: ${id}`);
    }
    return this.toDomain(entity);
  }

  private toDomain(entity: FormationSessionEntity): SessionRecord {
    return {
      id: entity.id,
      courseSlug: entity.courseSlug,
      teacherId: entity.teacherId,
      code: entity.code,
      etat: entity.etat,
      modeRythme: entity.modeRythme,
      ecranCourant: entity.ecranCourant,
      intervalleLibre: entity.intervalleLibre,
      bareme: entity.bareme,
      ouverteLe: entity.ouverteLe,
      fermeeLe: entity.fermeeLe,
      majLe: entity.majLe,
    };
  }
}
