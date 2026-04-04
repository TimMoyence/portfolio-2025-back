import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { BudgetCategory } from '../domain/BudgetCategory';
import type { BudgetType } from '../domain/BudgetCategory';
import type { IBudgetCategoryRepository } from '../domain/IBudgetCategory.repository';
import { BudgetCategoryEntity } from './entities/BudgetCategory.entity';

@Injectable()
export class BudgetCategoryRepositoryTypeORM implements IBudgetCategoryRepository {
  constructor(
    @InjectRepository(BudgetCategoryEntity)
    private readonly repo: Repository<BudgetCategoryEntity>,
  ) {}

  async create(data: BudgetCategory): Promise<BudgetCategory> {
    const entity = await this.repo.save(data as Partial<BudgetCategoryEntity>);
    return this.toDomain(entity);
  }

  async findByGroupId(groupId: string): Promise<BudgetCategory[]> {
    const entities = await this.repo.find({
      where: [{ groupId }, { groupId: IsNull() }],
      order: { displayOrder: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findDefaults(): Promise<BudgetCategory[]> {
    const entities = await this.repo.find({
      where: { groupId: IsNull() },
      order: { displayOrder: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: string): Promise<BudgetCategory | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return this.toDomainOrNull(entity);
  }

  private toDomain(entity: BudgetCategoryEntity): BudgetCategory {
    const cat = new BudgetCategory();
    cat.id = entity.id;
    cat.groupId = entity.groupId;
    cat.name = entity.name;
    cat.color = entity.color;
    cat.icon = entity.icon;
    cat.budgetType = entity.budgetType as BudgetType;
    cat.budgetLimit = Number(entity.budgetLimit);
    cat.displayOrder = entity.displayOrder;
    cat.createdAt = entity.createdAt;
    return cat;
  }

  private toDomainOrNull(
    entity: BudgetCategoryEntity | null,
  ): BudgetCategory | null {
    if (!entity) return null;
    return this.toDomain(entity);
  }
}
