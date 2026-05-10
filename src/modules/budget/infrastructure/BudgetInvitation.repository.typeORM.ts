import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetInvitation } from '../domain/BudgetInvitation';
import type { IBudgetInvitationRepository } from '../domain/IBudgetInvitation.repository';
import { BudgetInvitationEntity } from './entities/BudgetInvitation.entity';

/**
 * Repository TypeORM pour les invitations de budget. Les filtres
 * sur les colonnes nullable (`accepted_at`, `revoked_at`) passent
 * par un query builder car `findOne({ where: { acceptedAt: null } })`
 * genere `accepted_at = NULL` (toujours faux) au lieu du `IS NULL`
 * attendu.
 */
@Injectable()
export class BudgetInvitationTypeOrmRepository implements IBudgetInvitationRepository {
  constructor(
    @InjectRepository(BudgetInvitationEntity)
    private readonly repo: Repository<BudgetInvitationEntity>,
  ) {}

  async create(invitation: {
    groupId: string;
    inviterUserId: string;
    targetEmail: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<BudgetInvitation> {
    const entity = this.repo.create(invitation);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findByTokenHash(tokenHash: string): Promise<BudgetInvitation | null> {
    const entity = await this.repo.findOne({ where: { tokenHash } });
    return entity ? this.toDomain(entity) : null;
  }

  async findActiveByGroupAndEmail(
    groupId: string,
    targetEmail: string,
  ): Promise<BudgetInvitation | null> {
    const entity = await this.repo
      .createQueryBuilder('inv')
      .where('inv.group_id = :groupId', { groupId })
      .andWhere('inv.target_email = :targetEmail', { targetEmail })
      .andWhere('inv.accepted_at IS NULL')
      .andWhere('inv.revoked_at IS NULL')
      .getOne();
    return entity ? this.toDomain(entity) : null;
  }

  async findPendingByGroup(
    groupId: string,
    now: Date,
  ): Promise<BudgetInvitation[]> {
    const entities = await this.repo
      .createQueryBuilder('inv')
      .where('inv.group_id = :groupId', { groupId })
      .andWhere('inv.accepted_at IS NULL')
      .andWhere('inv.revoked_at IS NULL')
      .andWhere('inv.expires_at > :now', { now })
      .orderBy('inv.created_at', 'DESC')
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async markAccepted(
    invitationId: string,
    acceptedByUserId: string,
    acceptedAt: Date,
  ): Promise<void> {
    await this.repo.update(invitationId, { acceptedByUserId, acceptedAt });
  }

  async markRevoked(invitationId: string, revokedAt: Date): Promise<void> {
    await this.repo.update(invitationId, { revokedAt });
  }

  private toDomain(entity: BudgetInvitationEntity): BudgetInvitation {
    return new BudgetInvitation({
      id: entity.id,
      groupId: entity.groupId,
      inviterUserId: entity.inviterUserId,
      targetEmail: entity.targetEmail,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      acceptedAt: entity.acceptedAt,
      acceptedByUserId: entity.acceptedByUserId,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
    });
  }
}
