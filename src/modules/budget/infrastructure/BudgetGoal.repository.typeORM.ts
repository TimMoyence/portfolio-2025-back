import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetGoal, type BudgetGoalKind } from '../domain/BudgetGoal';
import type {
  BudgetGoalUpdatePatch,
  IBudgetGoalRepository,
} from '../domain/IBudgetGoal.repository';
import { BudgetGoalEntity } from './entities/BudgetGoal.entity';

/**
 * Implementation TypeORM du port IBudgetGoalRepository.
 * Persiste les objectifs de budget dans la table budget_goals
 * (epargne, plafond global, plafond par categorie).
 */
@Injectable()
export class BudgetGoalRepositoryTypeORM implements IBudgetGoalRepository {
  constructor(
    @InjectRepository(BudgetGoalEntity)
    private readonly entityRepo: Repository<BudgetGoalEntity>,
  ) {}

  async create(goal: BudgetGoal): Promise<BudgetGoal> {
    const saved = await this.entityRepo.save({
      id: goal.id,
      groupId: goal.groupId,
      createdByUserId: goal.createdByUserId,
      name: goal.name,
      kind: goal.kind,
      targetAmount: goal.targetAmount,
      categoryId: goal.categoryId,
      deadline: goal.deadline,
      isActive: goal.isActive,
    } as Partial<BudgetGoalEntity>);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<BudgetGoal | null> {
    const entity = await this.entityRepo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByGroupId(groupId: string): Promise<BudgetGoal[]> {
    const entities = await this.entityRepo.find({ where: { groupId } });
    return entities.map((e) => this.toDomain(e));
  }

  async update(id: string, patch: BudgetGoalUpdatePatch): Promise<BudgetGoal> {
    const updated = await this.entityRepo.save({
      id,
      ...patch,
    } as Partial<BudgetGoalEntity>);
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.entityRepo.delete(id);
  }

  /** Convertit une BudgetGoalEntity TypeORM en BudgetGoal domain (cast decimal Postgres en number). */
  private toDomain(entity: BudgetGoalEntity): BudgetGoal {
    return Object.assign(new BudgetGoal(), {
      id: entity.id,
      groupId: entity.groupId,
      createdByUserId: entity.createdByUserId,
      name: entity.name,
      kind: entity.kind as BudgetGoalKind,
      targetAmount: Number(entity.targetAmount),
      categoryId: entity.categoryId,
      deadline: entity.deadline,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
