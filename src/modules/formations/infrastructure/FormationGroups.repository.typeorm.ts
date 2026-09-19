import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  FormationGroupRecord,
  IFormationGroupsRepository,
} from '../domain/IFormationGroups.repository';
import { FormationParticipantEntity } from './entities/FormationParticipant.entity';
import { FormationGroupEntity } from './entities/FormationGroup.entity';

@Injectable()
export class FormationGroupsRepositoryTypeORM implements IFormationGroupsRepository {
  constructor(
    @InjectRepository(FormationGroupEntity)
    private readonly groups: Repository<FormationGroupEntity>,
    @InjectRepository(FormationParticipantEntity)
    private readonly participants: Repository<FormationParticipantEntity>,
  ) {}

  async create(sessionId: string, name: string): Promise<FormationGroupRecord> {
    const group = await this.groups.save(
      this.groups.create({ sessionId, name }),
    );
    return this.toDomain(group);
  }

  async rename(
    sessionId: string,
    groupId: string,
    name: string,
  ): Promise<FormationGroupRecord> {
    await this.groups.update({ id: groupId, sessionId }, { name });
    const group = await this.groups.findOne({
      where: { id: groupId, sessionId },
    });
    if (!group) {
      throw new Error('Groupe introuvable dans cette séance');
    }
    return this.toDomain(group);
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
      const group = await this.groups.findOne({
        where: { id: groupId, sessionId },
      });
      if (!group) {
        throw new Error('Groupe introuvable dans cette séance');
      }
    }
    const result = await this.participants.update(
      { id: participantId, sessionId },
      { groupId },
    );
    if (!result.affected) {
      throw new Error('Participant introuvable dans cette séance');
    }
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
