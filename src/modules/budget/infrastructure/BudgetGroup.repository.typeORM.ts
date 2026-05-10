import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BudgetGroup } from '../domain/BudgetGroup';
import type { BudgetMember } from '../domain/BudgetMember';
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
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Cree atomiquement un groupe et son owner-membre dans une seule
   * transaction (P0-4 audit 2026-05-09). Avant le fix, les deux saves
   * etaient consecutives sans transaction : si la 2eme echouait, on
   * laissait un groupe orphelin sans owner-membre — invariant casse.
   */
  async create(data: BudgetGroup): Promise<BudgetGroup> {
    return this.dataSource.transaction(async (manager) => {
      const entity = await manager.save(
        BudgetGroupEntity,
        data as Partial<BudgetGroupEntity>,
      );
      await manager.save(BudgetGroupMemberEntity, {
        groupId: entity.id,
        userId: entity.ownerId,
      });
      return this.toDomain(entity);
    });
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

  /** Retourne true si userId est l'owner du groupe (group inexistant => false). */
  async isOwner(groupId: string, userId: string): Promise<boolean> {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      select: ['ownerId'],
    });
    return group?.ownerId === userId;
  }

  /**
   * Liste les membres d'un groupe enrichis avec leurs infos user
   * (email, prenom, owner flag, date d'invitation). Owner first puis
   * ordre d'invitation chronologique. Requete SQL parametree ($1) pour
   * eviter toute injection.
   */
  async findMembersWithUsers(groupId: string): Promise<BudgetMember[]> {
    const rows: Array<{
      user_id: string;
      email: string;
      first_name: string | null;
      joined_at: Date;
      is_owner: boolean;
    }> = await this.dataSource.query(
      `SELECT u.id AS user_id,
              u.email AS email,
              u.first_name AS first_name,
              m.joined_at AS joined_at,
              (g.owner_id = u.id) AS is_owner
       FROM budget_group_members m
       JOIN users u ON u.id = m.user_id
       JOIN budget_groups g ON g.id = m.group_id
       WHERE m.group_id = $1
       ORDER BY (g.owner_id = u.id) DESC, m.joined_at ASC`,
      [groupId],
    );
    return rows.map((r) => ({
      userId: r.user_id,
      email: r.email,
      displayName: r.first_name ?? r.email.split('@')[0],
      isOwner: r.is_owner,
      joinedAt: r.joined_at,
    }));
  }

  /** Retire un membre du groupe. Idempotent (delete sans erreur si absent). */
  async removeMember(groupId: string, userId: string): Promise<void> {
    await this.memberRepo.delete({ groupId, userId });
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
