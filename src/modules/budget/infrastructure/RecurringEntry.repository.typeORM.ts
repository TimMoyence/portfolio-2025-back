import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringEntry } from '../domain/RecurringEntry';
import type { BudgetType } from '../domain/BudgetCategory';
import type { Frequency } from '../domain/RecurringEntry';
import type { IRecurringEntryRepository } from '../domain/IRecurringEntry.repository';
import { RecurringEntryEntity } from './entities/RecurringEntry.entity';

/** Implementation TypeORM du repository d'entrees recurrentes. */
@Injectable()
export class RecurringEntryRepositoryTypeORM implements IRecurringEntryRepository {
  constructor(
    @InjectRepository(RecurringEntryEntity)
    private readonly repo: Repository<RecurringEntryEntity>,
  ) {}

  async create(data: RecurringEntry): Promise<RecurringEntry> {
    const entity = await this.repo.save(data as Partial<RecurringEntryEntity>);
    return this.toDomain(entity);
  }

  async findByGroupId(groupId: string): Promise<RecurringEntry[]> {
    const entities = await this.repo.find({
      where: { groupId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: string): Promise<RecurringEntry | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return this.toDomainOrNull(entity);
  }

  async update(
    id: string,
    data: Partial<RecurringEntry>,
  ): Promise<RecurringEntry> {
    await this.repo.update({ id }, data as Partial<RecurringEntryEntity>);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Recurring entry ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async findActiveByGroupId(groupId: string): Promise<RecurringEntry[]> {
    const entities = await this.repo.find({
      where: { groupId, isActive: true },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: RecurringEntryEntity): RecurringEntry {
    return Object.assign(new RecurringEntry(), {
      id: entity.id,
      groupId: entity.groupId,
      createdByUserId: entity.createdByUserId,
      categoryId: entity.categoryId,
      description: entity.description,
      amount: Number(entity.amount),
      type: entity.type as BudgetType,
      frequency: entity.frequency as Frequency,
      dayOfMonth: entity.dayOfMonth,
      dayOfWeek: entity.dayOfWeek,
      startDate: entity.startDate,
      endDate: entity.endDate,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
    });
  }

  private toDomainOrNull(
    entity: RecurringEntryEntity | null,
  ): RecurringEntry | null {
    if (!entity) return null;
    return this.toDomain(entity);
  }
}
