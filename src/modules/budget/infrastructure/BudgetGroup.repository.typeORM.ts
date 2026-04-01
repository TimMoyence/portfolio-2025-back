import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { BudgetGroup } from '../domain/BudgetGroup';
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
    const group = await this.groupRepo.save(data as Partial<BudgetGroupEntity>);
    await this.memberRepo.save({ groupId: group.id, userId: group.ownerId });
    return group as unknown as BudgetGroup;
  }

  async findById(id: string): Promise<BudgetGroup | null> {
    const entity = await this.groupRepo.findOne({ where: { id } });
    return entity as unknown as BudgetGroup | null;
  }

  async findByOwnerId(userId: string): Promise<BudgetGroup[]> {
    const entities = await this.groupRepo.find({ where: { ownerId: userId } });
    return entities as unknown as BudgetGroup[];
  }

  async findByMemberId(userId: string): Promise<BudgetGroup[]> {
    const members = await this.memberRepo.find({ where: { userId } });
    if (members.length === 0) return [];
    const groupIds = members.map((m) => m.groupId);
    const entities = await this.groupRepo
      .createQueryBuilder('g')
      .where('g.id IN (:...ids)', { ids: groupIds })
      .getMany();
    return entities as unknown as BudgetGroup[];
  }

  async addMember(groupId: string, userId: string): Promise<void> {
    await this.memberRepo.save({ groupId, userId });
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const count = await this.memberRepo.count({ where: { groupId, userId } });
    return count > 0;
  }
}
