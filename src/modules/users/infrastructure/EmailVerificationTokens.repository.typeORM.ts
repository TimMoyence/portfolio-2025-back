import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import type { IEmailVerificationTokensRepository } from '../domain/IEmailVerificationTokens.repository';
import type { EmailVerificationToken } from '../domain/EmailVerificationToken';
import { EmailVerificationTokenEntity } from './entities/EmailVerificationToken.entity';
import { champsDuJeton, nonExpire } from './jetons.typeorm';

@Injectable()
export class EmailVerificationTokensRepositoryTypeORM
  extends DepotEnDomaine<EmailVerificationTokenEntity, EmailVerificationToken>
  implements IEmailVerificationTokensRepository
{
  constructor(
    @InjectRepository(EmailVerificationTokenEntity)
    repo: Repository<EmailVerificationTokenEntity>,
  ) {
    super(repo);
  }

  create(token: EmailVerificationToken): Promise<EmailVerificationToken> {
    return this.enregistrer(champsDuJeton(token));
  }

  findActiveByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null> {
    return this.trouver(nonExpire({ tokenHash }));
  }

  async invalidateActiveByUserId(userId: string): Promise<void> {
    const maintenant = new Date();
    await this.repo.update(
      { userId, expiresAt: MoreThan(maintenant) },
      { expiresAt: maintenant },
    );
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

  protected toDomain(
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
}
