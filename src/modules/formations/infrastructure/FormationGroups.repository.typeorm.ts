import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FormationGroupNameTakenError,
  FormationGroupNotFoundError,
  ParticipantNotFoundError,
} from '../domain/errors/FormationErrors';
import type {
  FormationGroupRecord,
  IFormationGroupsRepository,
} from '../domain/IFormationGroups.repository';
import { PostgresErrorClassifier } from './PostgresErrorClassifier';
import { FormationParticipantEntity } from './entities/FormationParticipant.entity';
import { FormationGroupEntity } from './entities/FormationGroup.entity';

const GROUP_NAME_CONSTRAINT = 'UQ_formation_groups_session_name';

@Injectable()
export class FormationGroupsRepositoryTypeORM
  extends PostgresErrorClassifier
  implements IFormationGroupsRepository
{
  constructor(
    @InjectRepository(FormationGroupEntity)
    private readonly groups: Repository<FormationGroupEntity>,
    @InjectRepository(FormationParticipantEntity)
    private readonly participants: Repository<FormationParticipantEntity>,
  ) {
    super();
  }

  async create(sessionId: string, name: string): Promise<FormationGroupRecord> {
    try {
      const group = await this.groups.save(
        this.groups.create({ sessionId, name }),
      );
      return this.toDomain(group);
    } catch (error) {
      throw this.nomDejaPrisOu(error, name);
    }
  }

  async rename(
    sessionId: string,
    groupId: string,
    name: string,
  ): Promise<FormationGroupRecord> {
    try {
      await this.groups.update({ id: groupId, sessionId }, { name });
    } catch (error) {
      throw this.nomDejaPrisOu(error, name);
    }
    return this.toDomain(await this.groupeDeLaSeance(sessionId, groupId));
  }

  async listBySession(
    sessionId: string,
  ): Promise<readonly FormationGroupRecord[]> {
    const groups = await this.groups.find({
      where: { sessionId },
      order: { name: 'ASC', id: 'ASC' },
    });
    return groups.map((group) => this.toDomain(group));
  }

  async assignParticipant(
    sessionId: string,
    participantId: string,
    groupId: string | null,
  ): Promise<void> {
    if (groupId !== null) {
      await this.groupeDeLaSeance(sessionId, groupId);
    }
    const result = await this.participants.update(
      { id: participantId, sessionId },
      { groupId },
    );
    if (!result.affected) {
      throw new ParticipantNotFoundError(participantId);
    }
  }

  private async groupeDeLaSeance(
    sessionId: string,
    groupId: string,
  ): Promise<FormationGroupEntity> {
    const group = await this.groups.findOne({
      where: { id: groupId, sessionId },
    });
    if (!group) {
      throw new FormationGroupNotFoundError(groupId);
    }
    return group;
  }

  private nomDejaPrisOu(error: unknown, name: string): unknown {
    return this.uniqueViolationConstraint(error) === GROUP_NAME_CONSTRAINT
      ? new FormationGroupNameTakenError(name)
      : error;
  }

  private toDomain(group: FormationGroupEntity): FormationGroupRecord {
    return {
      id: group.id,
      sessionId: group.sessionId,
      name: group.name,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }
}
