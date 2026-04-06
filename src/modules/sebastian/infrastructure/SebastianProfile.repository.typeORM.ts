import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SebastianProfile } from '../domain/SebastianProfile';
import type { ISebastianProfileRepository } from '../domain/ISebastianProfile.repository';
import { SebastianProfileEntity } from './entities/SebastianProfile.entity';

/** Implementation TypeORM du port de persistance des profils Sebastian. */
@Injectable()
export class SebastianProfileRepositoryTypeORM implements ISebastianProfileRepository {
  constructor(
    @InjectRepository(SebastianProfileEntity)
    private readonly repo: Repository<SebastianProfileEntity>,
  ) {}

  async findByUserId(userId: string): Promise<SebastianProfile | null> {
    const entity = await this.repo.findOne({ where: { userId } });
    return entity ? this.toDomain(entity) : null;
  }

  async createOrUpdate(profile: SebastianProfile): Promise<SebastianProfile> {
    const entity = await this.repo.save(
      profile as Partial<SebastianProfileEntity>,
    );
    return this.toDomain(entity);
  }

  private toDomain(entity: SebastianProfileEntity): SebastianProfile {
    return SebastianProfile.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      weightKg: Number(entity.weightKg),
      widmarkR: Number(entity.widmarkR),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
