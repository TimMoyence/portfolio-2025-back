import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import type { IEmailVerificationTokensRepository } from '../domain/IEmailVerificationTokens.repository';
import type { EmailVerificationToken } from '../domain/EmailVerificationToken';
import type { PlafondDEnvois } from '../domain/PlafondDEnvois';
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
    plafond: PlafondDEnvois,
  ): Promise<EmailVerificationToken | null> {
    const enregistre = await remplacerSousVerrou(
      this.repo,
      champsDuJeton(jeton),
      plafond,
      (depot) =>
        depot.update(nonExpire({ userId: jeton.userId }), {
          expiresAt: new Date(),
        }),
    );
    return enregistre && this.toDomain(enregistre);
  }

  findActiveByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null> {
    return this.trouver(nonExpire({ tokenHash }));
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.repo.delete({ userId });
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
