import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IsNull,
  Repository,
  type FindOptionsWhere,
  type UpdateResult,
} from 'typeorm';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { aAffecte } from '../../../common/infrastructure/typeorm/lignes-affectees';
import type { IPasswordResetTokensRepository } from '../domain/IPasswordResetTokens.repository';
import type { PasswordResetToken } from '../domain/PasswordResetToken';
import { PasswordResetTokenEntity } from './entities/PasswordResetToken.entity';
import {
  champsDuJeton,
  nonExpire,
  remplacerSousVerrou,
} from './jetons.typeorm';

function marquerUtilises(
  depot: Repository<PasswordResetTokenEntity>,
  critere: FindOptionsWhere<PasswordResetTokenEntity>,
): Promise<UpdateResult> {
  const maintenant = new Date();
  return depot.update(critere, { usedAt: maintenant, updatedAt: maintenant });
}

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

  async remplacerLesJetonsActifs(
    jeton: Pick<PasswordResetToken, 'userId' | 'tokenHash' | 'expiresAt'>,
  ): Promise<PasswordResetToken> {
    return this.toDomain(
      await remplacerSousVerrou(
        this.repo,
        { ...champsDuJeton(jeton), usedAt: null },
        (depot) =>
          marquerUtilises(
            depot,
            nonExpire({ userId: jeton.userId, usedAt: IsNull() }),
          ),
      ),
    );
  }

  findActiveByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.trouver(nonExpire({ tokenHash, usedAt: IsNull() }));
  }

  async markUsed(id: string): Promise<boolean> {
    return aAffecte(await marquerUtilises(this.repo, { id, usedAt: IsNull() }));
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
