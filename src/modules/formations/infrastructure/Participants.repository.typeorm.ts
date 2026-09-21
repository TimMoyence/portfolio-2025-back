import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Not, Repository } from 'typeorm';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import {
  SeanceCompleteError,
  SeedAlreadyAssignedError,
  SeedPoolExhaustedError,
} from '../domain/errors/FormationErrors';
import type {
  Inscription,
  InscriptionInput,
  IParticipantsRepository,
  ParticipantRecord,
} from '../domain/IParticipants.repository';
import { PostgresErrorClassifier } from './PostgresErrorClassifier';
import { FormationParticipantEntity } from './entities/FormationParticipant.entity';

const SESSION_KEY_CONSTRAINT = 'uq_formation_participants_session_key';
const SESSION_SEED_CONSTRAINT = 'uq_formation_participants_session_seed';

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

  inscrire(input: InscriptionInput): Promise<Inscription> {
    return this.repo.manager.transaction((manager) =>
      this.inscrireSousVerrou(manager, input),
    );
  }

  private async inscrireSousVerrou(
    manager: EntityManager,
    input: InscriptionInput,
  ): Promise<Inscription> {
    await manager.query(
      `SELECT "id" FROM "formation_sessions" WHERE "id" = $1 FOR UPDATE`,
      [input.sessionId],
    );

    const existant = await manager.findOne(FormationParticipantEntity, {
      where: {
        sessionId: input.sessionId,
        studentKey: input.studentKey,
        evinceLe: IsNull(),
      },
    });
    if (existant !== null) {
      return { participant: this.toDomain(existant), nouveau: false };
    }

    const inscrits = await manager.count(FormationParticipantEntity, {
      where: { sessionId: input.sessionId, evinceLe: IsNull() },
    });
    if (inscrits >= input.capacite) {
      throw new SeanceCompleteError(input.capacite);
    }

    const prises = await manager.find(FormationParticipantEntity, {
      where: { sessionId: input.sessionId, evinceLe: IsNull() },
      select: ['seed'],
    });
    const seed = input.choisirGraine(prises.map((prise) => prise.seed));
    if (seed === null) {
      throw new SeedPoolExhaustedError();
    }

    const entity = manager.create(FormationParticipantEntity, {
      sessionId: input.sessionId,
      studentKey: input.studentKey,
      prenom: input.prenom,
      nom: input.nom,
      email: input.email,
      groupId: null,
      seed,
    });
    try {
      const enregistre = await manager.save(entity);
      return { participant: this.toDomain(enregistre), nouveau: true };
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }
      throw this.conflictErrorFor(seed, this.uniqueViolationConstraint(error));
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
      where: { sessionId, studentKey, evinceLe: IsNull() },
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
      where: { sessionId, evinceLe: IsNull() },
      order: { rejointLe: 'ASC', id: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async listEvincesBySession(
    sessionId: string,
  ): Promise<readonly ParticipantRecord[]> {
    const entities = await this.repo.find({
      where: { sessionId, evinceLe: Not(IsNull()) },
      order: { evinceLe: 'ASC', id: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  countBySession(sessionId: string): Promise<number> {
    return this.repo.count({ where: { sessionId, evinceLe: IsNull() } });
  }

  async touch(id: string): Promise<void> {
    await this.repo.update(id, { dernierPing: new Date() });
  }

  async evincer(sessionId: string, participantId: string): Promise<boolean> {
    const misAJour = await this.repo.update(
      { id: participantId, sessionId, evinceLe: IsNull() },
      { evinceLe: new Date() },
    );
    return (misAJour.affected ?? 0) > 0;
  }

  async readmettre(sessionId: string, participantId: string): Promise<boolean> {
    const misAJour = await this.repo.update(
      { id: participantId, sessionId, evinceLe: Not(IsNull()) },
      { evinceLe: null },
    );
    return (misAJour.affected ?? 0) > 0;
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
      evinceLe: entity.evinceLe,
    };
  }
}
