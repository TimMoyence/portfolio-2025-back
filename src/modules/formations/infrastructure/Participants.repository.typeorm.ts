import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { SeedAlreadyAssignedError } from '../domain/errors/FormationErrors';
import type {
  CreateParticipantInput,
  IParticipantsRepository,
  ParticipantRecord,
} from '../domain/IParticipants.repository';
import { PostgresErrorClassifier } from './PostgresErrorClassifier';
import { FormationParticipantEntity } from './entities/FormationParticipant.entity';

const SESSION_KEY_CONSTRAINT = 'UQ_formation_participants_session_key';
const SESSION_SEED_CONSTRAINT = 'UQ_formation_participants_session_seed';

@Injectable()
export class ParticipantsRepositoryTypeORM
  extends PostgresErrorClassifier
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
      groupId: null,
      seed: input.seed,
    });
    try {
      const saved = await this.repo.save(entity);
      return this.toDomain(saved);
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }
      throw this.conflictErrorFor(
        input.seed,
        this.uniqueViolationConstraint(error),
      );
    }
  }

  private conflictErrorFor(
    seed: number,
    constraint: string | undefined,
  ): ResourceConflictError {
    if (constraint === SESSION_SEED_CONSTRAINT) {
      return new SeedAlreadyAssignedError(seed);
    }
    if (constraint === SESSION_KEY_CONSTRAINT) {
      return new ResourceConflictError(
        'Ce participant a deja rejoint cette session',
      );
    }
    return new ResourceConflictError(
      'Conflit lors de la creation du participant',
    );
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
    const entities = await this.repo.find({
      where: { sessionId },
      order: { rejointLe: 'ASC', id: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  countBySession(sessionId: string): Promise<number> {
    return this.repo.count({ where: { sessionId } });
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
      groupId: entity.groupId,
      seed: entity.seed,
      rejointLe: entity.rejointLe,
      dernierPing: entity.dernierPing,
    };
  }
}
