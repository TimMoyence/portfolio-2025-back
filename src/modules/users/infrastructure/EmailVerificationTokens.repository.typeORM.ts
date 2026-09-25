import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import type { IEmailVerificationTokensRepository } from '../domain/IEmailVerificationTokens.repository';
import type { EmailVerificationToken } from '../domain/EmailVerificationToken';
import { EmailVerificationTokenEntity } from './entities/EmailVerificationToken.entity';
import { jetonNonExpire } from './jetons.typeorm';

@Injectable()
export class EmailVerificationTokensRepositoryTypeORM implements IEmailVerificationTokensRepository {
  constructor(
    @InjectRepository(EmailVerificationTokenEntity)
    private readonly repo: Repository<EmailVerificationTokenEntity>,
  ) {}

  async create(token: EmailVerificationToken): Promise<EmailVerificationToken> {
    const entity = this.repo.create({
      userId: token.userId,
      token: token.token,
      expiresAt: token.expiresAt,
    });

    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findActiveByToken(
    token: string,
  ): Promise<EmailVerificationToken | null> {
    const entity = await jetonNonExpire(this.repo, { token });
    return entity ? this.toDomain(entity) : null;
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

  private toDomain(
    entity: EmailVerificationTokenEntity,
  ): EmailVerificationToken {
    return {
      id: entity.id,
      userId: entity.userId,
      token: entity.token,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
    };
  }
}
