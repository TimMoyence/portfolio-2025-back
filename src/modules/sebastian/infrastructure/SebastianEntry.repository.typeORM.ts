import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SebastianEntry } from '../domain/SebastianEntry';
import type {
  ISebastianEntryRepository,
  SebastianEntryFilters,
} from '../domain/ISebastianEntry.repository';
import { SebastianEntryEntity } from './entities/SebastianEntry.entity';

/** Implementation TypeORM du port de persistance des entrees Sebastian. */
@Injectable()
export class SebastianEntryRepositoryTypeORM implements ISebastianEntryRepository {
  constructor(
    @InjectRepository(SebastianEntryEntity)
    private readonly repo: Repository<SebastianEntryEntity>,
  ) {}

  async create(data: SebastianEntry): Promise<SebastianEntry> {
    const entity = await this.repo.save(data as Partial<SebastianEntryEntity>);
    return this.toDomain(entity);
  }

  async findByFilters(
    filters: SebastianEntryFilters,
  ): Promise<SebastianEntry[]> {
    const qb = this.repo
      .createQueryBuilder('e')
      .where('e.user_id = :userId', { userId: filters.userId });

    if (filters.from) {
      qb.andWhere('e.date >= :from', { from: filters.from });
    }

    if (filters.to) {
      qb.andWhere('e.date <= :to', { to: filters.to });
    }

    if (filters.category) {
      qb.andWhere('e.category = :category', { category: filters.category });
    }

    const entities = await qb.orderBy('e.date', 'DESC').getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: string): Promise<SebastianEntry | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return this.toDomainOrNull(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  private toDomain(entity: SebastianEntryEntity): SebastianEntry {
    return SebastianEntry.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      category: entity.category,
      quantity: Number(entity.quantity),
      unit: entity.unit,
      date: entity.date,
      notes: entity.notes,
      createdAt: entity.createdAt,
      drinkType: entity.drinkType,
      alcoholDegree:
        entity.alcoholDegree != null ? Number(entity.alcoholDegree) : null,
      volumeCl: entity.volumeCl != null ? Number(entity.volumeCl) : null,
      consumedAt: entity.consumedAt,
    });
  }

  private toDomainOrNull(
    entity: SebastianEntryEntity | null,
  ): SebastianEntry | null {
    if (!entity) return null;
    return this.toDomain(entity);
  }
}
