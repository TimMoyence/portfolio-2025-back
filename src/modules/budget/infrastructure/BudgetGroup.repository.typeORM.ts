import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetGroup } from '../domain/BudgetGroup';
import type { IBudgetGroupRepository } from '../domain/IBudgetGroup.repository';
import { BudgetGroupEntity } from './entities/BudgetGroup.entity';
import { BudgetGroupMemberEntity } from './entities/BudgetGroupMember.entity';

@Injectable()
export class BudgetGroupRepositoryTypeORM implements IBudgetGroupRepository {
  constructor(
    @InjectRepository(BudgetGroupEntity)
    private readonly groupRepo: Repository<BudgetGroupEntity>,
    @InjectRepository(BudgetGroupMemberEntity)
    private readonly memberRepo: Repository<BudgetGroupMemberEntity>,
  ) {}

  async create(data: BudgetGroup): Promise<BudgetGroup> {
    const entity = await this.groupRepo.save(
      data as Partial<BudgetGroupEntity>,
    );
    await this.memberRepo.save({ groupId: entity.id, userId: entity.ownerId });
    return this.toDomain(entity);
  }

  async findById(id: string): Promise<BudgetGroup | null> {
    const entity = await this.groupRepo.findOne({ where: { id } });
    return this.toDomainOrNull(entity);
  }

  async findByOwnerId(userId: string): Promise<BudgetGroup[]> {
    const entities = await this.groupRepo.find({ where: { ownerId: userId } });
    return entities.map((e) => this.toDomain(e));
  }

  async findByMemberId(userId: string): Promise<BudgetGroup[]> {
    const members = await this.memberRepo.find({ where: { userId } });
    if (members.length === 0) return [];
    const groupIds = members.map((m) => m.groupId);
    const entities = await this.groupRepo
      .createQueryBuilder('g')
      .where('g.id IN (:...ids)', { ids: groupIds })
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async addMember(groupId: string, userId: string): Promise<void> {
    await this.memberRepo.save({ groupId, userId });
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const count = await this.memberRepo.count({ where: { groupId, userId } });
    return count > 0;
  }

  private toDomain(entity: BudgetGroupEntity): BudgetGroup {
    const group = new BudgetGroup();
    group.id = entity.id;
    group.name = entity.name;
    group.ownerId = entity.ownerId;
    group.createdAt = entity.createdAt;
    group.updatedAt = entity.updatedAt;
    return group;
  }

  private toDomainOrNull(entity: BudgetGroupEntity | null): BudgetGroup | null {
    if (!entity) return null;
    return this.toDomain(entity);
  }
}
