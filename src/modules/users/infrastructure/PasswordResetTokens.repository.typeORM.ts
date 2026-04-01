import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import type { IPasswordResetTokensRepository } from '../domain/IPasswordResetTokens.repository';
import type { PasswordResetToken } from '../domain/PasswordResetToken';
import { PasswordResetTokenEntity } from './entities/PasswordResetToken.entity';

/** Implementation TypeORM du repository des jetons de reinitialisation. */
@Injectable()
export class PasswordResetTokensRepositoryTypeORM
  implements IPasswordResetTokensRepository
{
  constructor(
    @InjectRepository(PasswordResetTokenEntity)
    private readonly repo: Repository<PasswordResetTokenEntity>,
  ) {}

  async create(token: PasswordResetToken): Promise<PasswordResetToken> {
    const entity = this.repo.create({
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      usedAt: token.usedAt,
    });

    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findActiveByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetToken | null> {
    const entity = await this.repo.findOne({
      where: {
        tokenHash,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async invalidateActiveByUserId(userId: string): Promise<void> {
    await this.repo.update(
      {
        userId,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      {
        usedAt: new Date(),
        updatedAt: new Date(),
      },
    );
  }

  async markUsed(id: string): Promise<void> {
    await this.repo.update(
      { id },
      {
        usedAt: new Date(),
        updatedAt: new Date(),
      },
    );
  }

  private toDomain(entity: PasswordResetTokenEntity): PasswordResetToken {
    return {
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
