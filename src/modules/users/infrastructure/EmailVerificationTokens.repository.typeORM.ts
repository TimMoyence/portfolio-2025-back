import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { poseeDepuisMoinsDe } from '../../../common/infrastructure/typeorm/horloge-de-la-base';
import type { IEmailVerificationTokensRepository } from '../domain/IEmailVerificationTokens.repository';
import type { EmailVerificationToken } from '../domain/EmailVerificationToken';
import { EmailVerificationTokenEntity } from './entities/EmailVerificationToken.entity';
import {
  champsDuJeton,
  nonExpire,
  remplacerSousVerrou,
} from './jetons.typeorm';

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

  async remplacerLesJetonsActifs(
    jeton: Pick<EmailVerificationToken, 'userId' | 'tokenHash' | 'expiresAt'>,
  ): Promise<EmailVerificationToken> {
    return this.toDomain(
      await remplacerSousVerrou(this.repo, champsDuJeton(jeton), (depot) =>
        depot.update(nonExpire({ userId: jeton.userId }), {
          expiresAt: new Date(),
        }),
      ),
    );
  }

  findActiveByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null> {
    return this.trouver(nonExpire({ tokenHash }));
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }

  countRecentByUserId(userId: string, sinceMs: number): Promise<number> {
    return this.repo.count({
      where: { userId, createdAt: poseeDepuisMoinsDe(sinceMs) },
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
