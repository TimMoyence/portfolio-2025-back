import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import type { IEmailVerificationTokensRepository } from '../domain/IEmailVerificationTokens.repository';
import type { EmailVerificationToken } from '../domain/EmailVerificationToken';
import { EmailVerificationTokenEntity } from './entities/EmailVerificationToken.entity';
import { champsDuJeton, enregistrerJeton, jetonActif } from './jetons.typeorm';

@Injectable()
export class EmailVerificationTokensRepositoryTypeORM implements IEmailVerificationTokensRepository {
  constructor(
    @InjectRepository(EmailVerificationTokenEntity)
    private readonly repo: Repository<EmailVerificationTokenEntity>,
  ) {}

  create(token: EmailVerificationToken): Promise<EmailVerificationToken> {
    return enregistrerJeton(this.repo, champsDuJeton(token), versLeDomaine);
  }

  findActiveByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null> {
    return jetonActif(this.repo, { tokenHash }, versLeDomaine);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }

  async countRecentByUserId(userId: string, sinceMs: number): Promise<number> {
    const since = new Date(Date.now() - sinceMs);
    return this.repo.count({
      where: {
        userId,
        createdAt: MoreThan(since),
      },
    });
  }
}

function versLeDomaine(
  entity: EmailVerificationTokenEntity,
): EmailVerificationToken {
  return {
    id: entity.id,
    userId: entity.userId,
    tokenHash: entity.tokenHash,
    expiresAt: entity.expiresAt,
    createdAt: entity.createdAt,
  };
}
