import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SebastianBadge } from '../domain/SebastianBadge';
import type { ISebastianBadgeRepository } from '../domain/ISebastianBadge.repository';
import { SebastianBadgeEntity } from './entities/SebastianBadge.entity';

/** Implementation TypeORM du port de persistance des badges Sebastian. */
@Injectable()
export class SebastianBadgeRepositoryTypeORM implements ISebastianBadgeRepository {
  constructor(
    @InjectRepository(SebastianBadgeEntity)
    private readonly repo: Repository<SebastianBadgeEntity>,
  ) {}

  async create(data: SebastianBadge): Promise<SebastianBadge> {
    const entity = await this.repo.save(data as Partial<SebastianBadgeEntity>);
    return this.toDomain(entity);
  }

  async findByUserId(userId: string): Promise<SebastianBadge[]> {
    const entities = await this.repo.find({
      where: { userId },
      order: { unlockedAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByUserIdAndKey(
    userId: string,
    badgeKey: string,
  ): Promise<SebastianBadge | null> {
    const entity = await this.repo.findOne({
      where: { userId, badgeKey },
    });
    return this.toDomainOrNull(entity);
  }

  private toDomain(entity: SebastianBadgeEntity): SebastianBadge {
    return SebastianBadge.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      badgeKey: entity.badgeKey,
      category: entity.category,
      unlockedAt: entity.unlockedAt,
    });
  }

  private toDomainOrNull(
    entity: SebastianBadgeEntity | null,
  ): SebastianBadge | null {
    if (!entity) return null;
    return this.toDomain(entity);
  }
}
