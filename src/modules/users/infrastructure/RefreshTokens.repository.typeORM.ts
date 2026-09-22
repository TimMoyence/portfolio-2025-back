import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { RefreshToken } from '../domain/RefreshToken';
import { RefreshTokenEntity } from './entities/RefreshToken.entity';

@Injectable()
export class RefreshTokensRepositoryTypeORM implements IRefreshTokensRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repo: Repository<RefreshTokenEntity>,
  ) {}

  async create(token: RefreshToken): Promise<RefreshToken> {
    const entity = this.repo.create({
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      revoked: token.revoked,
      rotationGraceUntil: token.rotationGraceUntil ?? null,
    });

    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const entity = await this.repo.findOne({
      where: { tokenHash },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async revokeByUserId(userId: string): Promise<void> {
    await this.repo.update(
      { userId },
      { revoked: true, rotationGraceUntil: null },
    );
  }

  async revokeById(id: string): Promise<void> {
    await this.repo.update({ id }, { revoked: true, rotationGraceUntil: null });
  }

  async rotateById(id: string, graceUntil: Date): Promise<boolean> {
    const result = await this.repo.update(
      { id, revoked: false },
      { revoked: true, rotationGraceUntil: graceUntil },
    );

    return result.affected === 1;
  }

  async purgeExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.repo.delete([
      { revoked: true, createdAt: LessThan(cutoff) },
      { expiresAt: LessThan(new Date()) },
    ]);
    return typeof result.affected === 'number' ? result.affected : 0;
  }

  private toDomain(entity: RefreshTokenEntity): RefreshToken {
    return {
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      revoked: entity.revoked,
      rotationGraceUntil: entity.rotationGraceUntil,
      createdAt: entity.createdAt,
    };
  }
}
