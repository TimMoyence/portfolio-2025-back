import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetMemberContribution } from '../domain/BudgetMemberContribution';
import type { IBudgetMemberContributionRepository } from '../domain/IBudgetMemberContribution.repository';
import { BudgetMemberContributionEntity } from './entities/BudgetMemberContribution.entity';

/**
 * Implementation TypeORM du port IBudgetMemberContributionRepository.
 * Persiste les contributions mensuelles des membres dans la table
 * budget_member_contributions (clef unique groupId/userId/month/year).
 */
@Injectable()
export class BudgetMemberContributionRepositoryTypeORM implements IBudgetMemberContributionRepository {
  constructor(
    @InjectRepository(BudgetMemberContributionEntity)
    private readonly entityRepo: Repository<BudgetMemberContributionEntity>,
  ) {}

  async findByGroupAndPeriod(
    groupId: string,
    month: number,
    year: number,
  ): Promise<BudgetMemberContribution[]> {
    const entities = await this.entityRepo.find({
      where: { groupId, month, year },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async upsertForUser(input: {
    groupId: string;
    userId: string;
    month: number;
    year: number;
    monthlySalary: number;
  }): Promise<BudgetMemberContribution> {
    await this.entityRepo.upsert(input, ['groupId', 'userId', 'month', 'year']);
    const persisted = await this.entityRepo.findOne({
      where: {
        groupId: input.groupId,
        userId: input.userId,
        month: input.month,
        year: input.year,
      },
    });
    if (!persisted) {
      throw new Error(
        'Contribution upsert succeeded but findOne returned null',
      );
    }
    return this.toDomain(persisted);
  }

  async findLastForUserBefore(
    groupId: string,
    userId: string,
    beforeMonth: number,
    beforeYear: number,
  ): Promise<BudgetMemberContribution | null> {
    const entity = await this.entityRepo
      .createQueryBuilder('c')
      .where('c.group_id = :groupId', { groupId })
      .andWhere('c.user_id = :userId', { userId })
      .andWhere(
        '(c.year < :beforeYear OR (c.year = :beforeYear AND c.month < :beforeMonth))',
        { beforeYear, beforeMonth },
      )
      .orderBy('c.year', 'DESC')
      .addOrderBy('c.month', 'DESC')
      .limit(1)
      .getOne();
    return entity ? this.toDomain(entity) : null;
  }

  /** Convertit une entite TypeORM en entite domaine (cast decimal Postgres en number). */
  private toDomain(
    entity: BudgetMemberContributionEntity,
  ): BudgetMemberContribution {
    const contribution = new BudgetMemberContribution();
    contribution.id = entity.id;
    contribution.groupId = entity.groupId;
    contribution.userId = entity.userId;
    contribution.month = entity.month;
    contribution.year = entity.year;
    contribution.monthlySalary = Number(entity.monthlySalary);
    contribution.createdAt = entity.createdAt;
    contribution.updatedAt = entity.updatedAt;
    return contribution;
  }
}
