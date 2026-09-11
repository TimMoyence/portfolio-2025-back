import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import type {
  CreateParticipantInput,
  IParticipantsRepository,
  ParticipantRecord,
} from '../domain/IParticipants.repository';
import { BaseFormationRepository } from './BaseFormationRepository';
import { FormationParticipantEntity } from './entities/FormationParticipant.entity';

@Injectable()
export class ParticipantsRepositoryTypeORM
  extends BaseFormationRepository
  implements IParticipantsRepository
{
  constructor(
    @InjectRepository(FormationParticipantEntity)
    private readonly repo: Repository<FormationParticipantEntity>,
  ) {
    super();
  }

  async create(input: CreateParticipantInput): Promise<ParticipantRecord> {
    const entity = this.repo.create({
      sessionId: input.sessionId,
      studentKey: input.studentKey,
      prenom: input.prenom,
      nom: input.nom,
      email: input.email,
      seed: input.seed,
    });
    try {
      const saved = await this.repo.save(entity);
      return this.toDomain(saved);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ResourceConflictError(
          'Ce participant a deja rejoint cette session',
        );
      }
      throw error;
    }
  }

  async findBySessionAndStudentKey(
    sessionId: string,
    studentKey: string,
  ): Promise<ParticipantRecord | null> {
    const entity = await this.repo.findOne({
      where: { sessionId, studentKey },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: string): Promise<ParticipantRecord | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async listBySession(
    sessionId: string,
  ): Promise<readonly ParticipantRecord[]> {
    const entities = await this.repo.find({ where: { sessionId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async listSeedsBySession(sessionId: string): Promise<readonly number[]> {
    const entities = await this.repo.find({
      where: { sessionId },
      select: ['seed'],
    });
    return entities.map((entity) => entity.seed);
  }

  async touch(id: string): Promise<void> {
    await this.repo.update(id, { dernierPing: new Date() });
  }

  private toDomain(entity: FormationParticipantEntity): ParticipantRecord {
    return {
      id: entity.id,
      sessionId: entity.sessionId,
      studentKey: entity.studentKey,
      prenom: entity.prenom,
      nom: entity.nom,
      email: entity.email,
      seed: entity.seed,
      rejointLe: entity.rejointLe,
      dernierPing: entity.dernierPing,
    };
  }
}
