import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import type { IBudgetShareAttemptRepository } from '../domain/IBudgetShareAttempt.repository';
import { BudgetShareAttemptEntity } from './entities/BudgetShareAttempt.entity';

/**
 * Implementation TypeORM du repository de tentatives de partage.
 * Sert au cooldown applicatif anti mail-bombing (CRIT-2).
 */
@Injectable()
export class BudgetShareAttemptRepositoryTypeORM implements IBudgetShareAttemptRepository {
  constructor(
    @InjectRepository(BudgetShareAttemptEntity)
    private readonly repo: Repository<BudgetShareAttemptEntity>,
  ) {}

  async findRecent(
    groupId: string,
    targetEmail: string,
    since: Date,
  ): Promise<{ sentAt: Date } | null> {
    const found = await this.repo.findOne({
      where: { groupId, targetEmail, sentAt: MoreThanOrEqual(since) },
      order: { sentAt: 'DESC' },
    });
    return found ? { sentAt: found.sentAt } : null;
  }

  async record(
    groupId: string,
    targetEmail: string,
    sentAt: Date,
    inviterUserId: string,
  ): Promise<void> {
    await this.repo.save(
      this.repo.create({ groupId, targetEmail, sentAt, inviterUserId }),
    );
  }

  async countByInviterSince(
    inviterUserId: string,
    since: Date,
  ): Promise<number> {
    return this.repo.count({
      where: { inviterUserId, sentAt: MoreThanOrEqual(since) },
    });
  }
}
