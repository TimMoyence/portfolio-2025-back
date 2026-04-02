import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { RefreshToken } from '../domain/RefreshToken';
import { RefreshTokenEntity } from './entities/RefreshToken.entity';

/** Implementation TypeORM du repository des jetons de rafraichissement. */
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
    await this.repo.update({ userId, revoked: false }, { revoked: true });
  }

  async revokeById(id: string): Promise<void> {
    await this.repo.update({ id }, { revoked: true });
  }

  private toDomain(entity: RefreshTokenEntity): RefreshToken {
    return {
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      revoked: entity.revoked,
      createdAt: entity.createdAt,
    };
  }
}
