import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Not, Repository } from 'typeorm';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import {
  GraineRepriseError,
  ParticipantEvinceError,
  PlaceDejaPriseError,
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
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { FormationParticipantEntity } from './entities/FormationParticipant.entity';

const SESSION_KEY_CONSTRAINT = 'uq_formation_participants_session_key';
const SESSION_SEED_CONSTRAINT = 'uq_formation_participants_session_seed';

@Injectable()
export class ParticipantsRepositoryTypeORM
  extends DepotEnDomaine<FormationParticipantEntity, ParticipantRecord>
  implements IParticipantsRepository
{
  constructor(
    @InjectRepository(FormationParticipantEntity)
    repo: Repository<FormationParticipantEntity>,
  ) {
    super(repo);
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
    await this.verrouillerLaSeance(manager, input.sessionId);

    const existant = await manager.findOne(FormationParticipantEntity, {
      where: {
        sessionId: input.sessionId,
        studentKey: input.studentKey,
        evinceLe: IsNull(),
      },
    });
    if (existant !== null) {
      return this.reprendreLaPlace(manager, existant, input);
    }

    const evince = await manager.findOne(FormationParticipantEntity, {
      where: {
        sessionId: input.sessionId,
        studentKey: input.studentKey,
        evinceLe: Not(IsNull()),
      },
    });
    if (evince !== null) {
      throw new ParticipantEvinceError();
    }

    await this.assurerUnePlaceLibre(manager, input.sessionId, input.capacite);

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
      seed,
      empreinteDeReprise: input.empreinteDeReprise,
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

  private async verrouillerLaSeance(
    manager: EntityManager,
    sessionId: string,
  ): Promise<void> {
    await manager.query(
      `SELECT "id" FROM "formation_sessions" WHERE "id" = $1 FOR UPDATE`,
      [sessionId],
    );
  }

  private async assurerUnePlaceLibre(
    manager: EntityManager,
    sessionId: string,
    capacite: number,
  ): Promise<void> {
    const inscrits = await manager.count(FormationParticipantEntity, {
      where: { sessionId, evinceLe: IsNull() },
    });
    if (inscrits >= capacite) {
      throw new SeanceCompleteError(capacite);
    }
  }

  private async reprendreLaPlace(
    manager: EntityManager,
    existant: FormationParticipantEntity,
    input: InscriptionInput,
  ): Promise<Inscription> {
    if (!input.repriseAutorisee(existant.empreinteDeReprise ?? null)) {
      throw new PlaceDejaPriseError();
    }
    const misAJour = await manager.update(
      FormationParticipantEntity,
      { id: existant.id, evinceLe: IsNull() },
      { empreinteDeReprise: input.empreinteDeReprise },
    );
    if ((misAJour.affected ?? 0) === 0) {
      throw new ParticipantEvinceError();
    }
    return { participant: this.toDomain(existant), nouveau: false };
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

  findBySessionAndStudentKey(
    sessionId: string,
    studentKey: string,
  ): Promise<ParticipantRecord | null> {
    return this.trouver({ sessionId, studentKey, evinceLe: IsNull() });
  }

  findById(id: string): Promise<ParticipantRecord | null> {
    return this.trouver({ id });
  }

  listBySession(sessionId: string): Promise<readonly ParticipantRecord[]> {
    return this.lister({
      where: { sessionId, evinceLe: IsNull() },
      order: { rejointLe: 'ASC', id: 'ASC' },
    });
  }

  listEvincesBySession(
    sessionId: string,
  ): Promise<readonly ParticipantRecord[]> {
    return this.lister({
      where: { sessionId, evinceLe: Not(IsNull()) },
      order: { evinceLe: 'ASC', id: 'ASC' },
    });
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

  readmettre(
    sessionId: string,
    participantId: string,
    capacite: number,
  ): Promise<boolean> {
    return this.repo.manager.transaction(async (manager) => {
      await this.verrouillerLaSeance(manager, sessionId);
      await this.assurerUnePlaceLibre(manager, sessionId, capacite);
      try {
        const misAJour = await manager.update(
          FormationParticipantEntity,
          { id: participantId, sessionId, evinceLe: Not(IsNull()) },
          { evinceLe: null },
        );
        return (misAJour.affected ?? 0) > 0;
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }
        throw this.conflitDeReadmission(this.uniqueViolationConstraint(error));
      }
    });
  }

  private conflitDeReadmission(
    constraint: string | undefined,
  ): ResourceConflictError {
    if (constraint === SESSION_SEED_CONSTRAINT) {
      return new GraineRepriseError();
    }
    return new ResourceConflictError(
      'Ce participant a deja rejoint cette session sous un autre poste',
    );
  }

  libererPoste(sessionId: string, participantId: string): Promise<boolean> {
    return this.repo.manager.transaction(async (manager) => {
      await this.verrouillerLaSeance(manager, sessionId);
      const misAJour = await manager.update(
        FormationParticipantEntity,
        { id: participantId, sessionId, evinceLe: IsNull() },
        {
          empreinteDeReprise: null,
          generationDeJeton: () => '"generation_de_jeton" + 1',
        },
      );
      return (misAJour.affected ?? 0) > 0;
    });
  }

  protected toDomain(entity: FormationParticipantEntity): ParticipantRecord {
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
      evinceLe: entity.evinceLe,
      generationDeJeton: entity.generationDeJeton,
    };
  }
}
