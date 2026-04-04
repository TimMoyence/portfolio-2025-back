import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SebastianGoal } from '../domain/SebastianGoal';
import type { ISebastianGoalRepository } from '../domain/ISebastianGoal.repository';
import { SebastianGoalEntity } from './entities/SebastianGoal.entity';

/** Implementation TypeORM du port de persistance des objectifs Sebastian. */
@Injectable()
export class SebastianGoalRepositoryTypeORM implements ISebastianGoalRepository {
  constructor(
    @InjectRepository(SebastianGoalEntity)
    private readonly repo: Repository<SebastianGoalEntity>,
  ) {}

  async create(data: SebastianGoal): Promise<SebastianGoal> {
    const entity = await this.repo.save(data as Partial<SebastianGoalEntity>);
    return this.toDomain(entity);
  }

  async findByUserId(userId: string): Promise<SebastianGoal[]> {
    const entities = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: string): Promise<SebastianGoal | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return this.toDomainOrNull(entity);
  }

  async update(
    id: string,
    data: Partial<SebastianGoal>,
  ): Promise<SebastianGoal> {
    await this.repo.update({ id }, data as Partial<SebastianGoalEntity>);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Sebastian goal ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  private toDomain(entity: SebastianGoalEntity): SebastianGoal {
    return SebastianGoal.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      category: entity.category,
      targetQuantity: Number(entity.targetQuantity),
      period: entity.period,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
    });
  }

  private toDomainOrNull(
    entity: SebastianGoalEntity | null,
  ): SebastianGoal | null {
    if (!entity) return null;
    return this.toDomain(entity);
  }
}
