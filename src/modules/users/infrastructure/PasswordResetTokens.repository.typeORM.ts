import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IsNull,
  MoreThan,
  Repository,
  type FindOptionsWhere,
  type UpdateResult,
} from 'typeorm';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { aAffecte } from '../../../common/infrastructure/typeorm/lignes-affectees';
import type { IPasswordResetTokensRepository } from '../domain/IPasswordResetTokens.repository';
import type { PasswordResetToken } from '../domain/PasswordResetToken';
import { PasswordResetTokenEntity } from './entities/PasswordResetToken.entity';
import { champsDuJeton, nonExpire } from './jetons.typeorm';

@Injectable()
export class PasswordResetTokensRepositoryTypeORM
  extends DepotEnDomaine<PasswordResetTokenEntity, PasswordResetToken>
  implements IPasswordResetTokensRepository
{
  constructor(
    @InjectRepository(PasswordResetTokenEntity)
    repo: Repository<PasswordResetTokenEntity>,
  ) {
    super(repo);
  }

  create(token: PasswordResetToken): Promise<PasswordResetToken> {
    return this.enregistrer({ ...champsDuJeton(token), usedAt: token.usedAt });
  }

  findActiveByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.trouver(nonExpire({ tokenHash, usedAt: IsNull() }));
  }

  async invalidateActiveByUserId(userId: string): Promise<void> {
    await this.marquerUtilises({
      userId,
      usedAt: IsNull(),
      expiresAt: MoreThan(new Date()),
    });
  }

  async markUsed(id: string): Promise<boolean> {
    return aAffecte(await this.marquerUtilises({ id, usedAt: IsNull() }));
  }

  private marquerUtilises(
    critere: FindOptionsWhere<PasswordResetTokenEntity>,
  ): Promise<UpdateResult> {
    const maintenant = new Date();
    return this.repo.update(critere, {
      usedAt: maintenant,
      updatedAt: maintenant,
    });
  }

  protected toDomain(entity: PasswordResetTokenEntity): PasswordResetToken {
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
