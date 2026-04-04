import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetEntry } from '../domain/BudgetEntry';
import type { BudgetType } from '../domain/BudgetCategory';
import type {
  BudgetEntryFilters,
  IBudgetEntryRepository,
} from '../domain/IBudgetEntry.repository';
import { BudgetEntryEntity } from './entities/BudgetEntry.entity';

@Injectable()
export class BudgetEntryRepositoryTypeORM implements IBudgetEntryRepository {
  constructor(
    @InjectRepository(BudgetEntryEntity)
    private readonly repo: Repository<BudgetEntryEntity>,
  ) {}

  async create(data: BudgetEntry): Promise<BudgetEntry> {
    const entity = await this.repo.save(data as Partial<BudgetEntryEntity>);
    return this.toDomain(entity);
  }

  async createMany(data: BudgetEntry[]): Promise<BudgetEntry[]> {
    const entities = await this.repo.save(data as Partial<BudgetEntryEntity>[]);
    return entities.map((e) => this.toDomain(e));
  }

  async findByFilters(filters: BudgetEntryFilters): Promise<BudgetEntry[]> {
    const qb = this.repo
      .createQueryBuilder('e')
      .where('e.group_id = :groupId', { groupId: filters.groupId });

    if (filters.month && filters.year) {
      qb.andWhere('EXTRACT(MONTH FROM e.date) = :month', {
        month: filters.month,
      });
      qb.andWhere('EXTRACT(YEAR FROM e.date) = :year', { year: filters.year });
    }

    if (filters.categoryId) {
      qb.andWhere('e.category_id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    const entities = await qb.orderBy('e.date', 'DESC').getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: string): Promise<BudgetEntry | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return this.toDomainOrNull(entity);
  }

  async update(id: string, data: Partial<BudgetEntry>): Promise<BudgetEntry> {
    await this.repo.update({ id }, data as Partial<BudgetEntryEntity>);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Budget entry ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  private toDomain(entity: BudgetEntryEntity): BudgetEntry {
    const entry = new BudgetEntry();
    entry.id = entity.id;
    entry.groupId = entity.groupId;
    entry.createdByUserId = entity.createdByUserId;
    entry.categoryId = entity.categoryId;
    entry.date = entity.date;
    entry.description = entity.description;
    entry.amount = Number(entity.amount);
    entry.type = entity.type as BudgetType;
    entry.state = entity.state;
    entry.createdAt = entity.createdAt;
    entry.updatedAt = entity.updatedAt;
    return entry;
  }

  private toDomainOrNull(entity: BudgetEntryEntity | null): BudgetEntry | null {
    if (!entity) return null;
    return this.toDomain(entity);
  }
}
