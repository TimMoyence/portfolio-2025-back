import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import type { IPasswordResetTokensRepository } from '../domain/IPasswordResetTokens.repository';
import type { PasswordResetToken } from '../domain/PasswordResetToken';
import { PasswordResetTokenEntity } from './entities/PasswordResetToken.entity';
import { champsDuJeton, enregistrerJeton, jetonActif } from './jetons.typeorm';

@Injectable()
export class PasswordResetTokensRepositoryTypeORM implements IPasswordResetTokensRepository {
  constructor(
    @InjectRepository(PasswordResetTokenEntity)
    private readonly repo: Repository<PasswordResetTokenEntity>,
  ) {}

  create(token: PasswordResetToken): Promise<PasswordResetToken> {
    return enregistrerJeton(
      this.repo,
      { ...champsDuJeton(token), usedAt: token.usedAt },
      versLeDomaine,
    );
  }

  findActiveByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return jetonActif(
      this.repo,
      { tokenHash, usedAt: IsNull() },
      versLeDomaine,
    );
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
}

function versLeDomaine(entity: PasswordResetTokenEntity): PasswordResetToken {
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
