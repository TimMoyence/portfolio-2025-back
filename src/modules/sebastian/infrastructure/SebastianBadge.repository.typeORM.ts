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

  /**
   * Persiste un badge de maniere idempotente.
   *
   * En cas de violation de la contrainte unique `(user_id, badge_key)`
   * (race condition entre deux evaluations concurrentes), l'insertion
   * est silencieusement ignoree et le badge existant est retourne. Cela
   * garantit qu'un meme utilisateur ne puisse jamais avoir deux instances
   * d'un meme badge, tout en absorbant les inserts concurrents.
   */
  async create(data: SebastianBadge): Promise<SebastianBadge> {
    const result = await this.repo
      .createQueryBuilder()
      .insert()
      .into(SebastianBadgeEntity)
      .values(data as Partial<SebastianBadgeEntity>)
      .orIgnore()
      .returning('*')
      .execute();

    const rawRows = (result.raw as SebastianBadgeEntity[] | undefined) ?? [];
    const inserted: SebastianBadgeEntity | undefined = rawRows[0];
    if (inserted) {
      return this.toDomain(inserted);
    }

    // Pas d'insertion : un badge existait deja — on retourne l'existant.
    const existing = await this.repo.findOne({
      where: { userId: data.userId, badgeKey: data.badgeKey },
    });
    if (!existing) {
      // Cas theoriquement impossible (insert ignore sans conflit reel).
      throw new Error(
        `SebastianBadgeRepository: create returned no row and findOne failed for (${data.userId}, ${data.badgeKey})`,
      );
    }
    return this.toDomain(existing);
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
