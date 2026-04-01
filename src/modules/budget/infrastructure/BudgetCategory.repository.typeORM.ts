import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type { BudgetCategory } from '../domain/BudgetCategory';
import type { IBudgetCategoryRepository } from '../domain/IBudgetCategory.repository';
import { BudgetCategoryEntity } from './entities/BudgetCategory.entity';

@Injectable()
export class BudgetCategoryRepositoryTypeORM
  implements IBudgetCategoryRepository
{
  constructor(
    @InjectRepository(BudgetCategoryEntity)
    private readonly repo: Repository<BudgetCategoryEntity>,
  ) {}

  async create(data: BudgetCategory): Promise<BudgetCategory> {
    const entity = await this.repo.save(data as Partial<BudgetCategoryEntity>);
    return entity as unknown as BudgetCategory;
  }

  async findByGroupId(groupId: string): Promise<BudgetCategory[]> {
    const entities = await this.repo.find({
      where: [{ groupId }, { groupId: IsNull() }],
      order: { displayOrder: 'ASC' },
    });
    return entities as unknown as BudgetCategory[];
  }

  async findDefaults(): Promise<BudgetCategory[]> {
    const entities = await this.repo.find({
      where: { groupId: IsNull() },
      order: { displayOrder: 'ASC' },
    });
    return entities as unknown as BudgetCategory[];
  }

  async findById(id: string): Promise<BudgetCategory | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity as unknown as BudgetCategory | null;
  }
}
