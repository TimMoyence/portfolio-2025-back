import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, IsNull, LessThan, Not, Repository } from 'typeorm';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { poseeIlYAPlusDe } from '../../../common/infrastructure/typeorm/horloge-de-la-base';
import {
  aAffecte,
  lignesAffectees,
} from '../../../common/infrastructure/typeorm/lignes-affectees';
import { verrouillerJusquALaFinDeLaTransaction } from '../../../common/infrastructure/typeorm/verrou-de-transaction';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { RefreshToken } from '../domain/RefreshToken';
import { RefreshTokenEntity } from './entities/RefreshToken.entity';
import { champsDuJeton } from './jetons.typeorm';

const SEPT_JOURS_MS = 7 * 24 * 60 * 60 * 1000;

const champsDuJetonDeRafraichissement = (token: RefreshToken) => ({
  ...champsDuJeton(token),
  revoked: token.revoked,
  rotationGraceUntil: token.rotationGraceUntil ?? null,
});

@Injectable()
export class RefreshTokensRepositoryTypeORM
  extends DepotEnDomaine<RefreshTokenEntity, RefreshToken>
  implements IRefreshTokensRepository
{
  constructor(
    @InjectRepository(RefreshTokenEntity)
    repo: Repository<RefreshTokenEntity>,
  ) {
    super(repo);
  }

  create(token: RefreshToken): Promise<RefreshToken> {
    return this.enregistrer(champsDuJetonDeRafraichissement(token));
  }

  createSuccessor(
    previousId: string,
    token: RefreshToken,
  ): Promise<RefreshToken | null> {
    return this.repo.manager.transaction(async (manager) => {
      await this.verrouillerLeCompte(manager, token.userId);
      const precedentEnGrace = await manager.findOne(RefreshTokenEntity, {
        where: {
          id: previousId,
          userId: token.userId,
          rotationGraceUntil: Not(IsNull()),
        },
      });
      if (precedentEnGrace === null) {
        return null;
      }
      return this.toDomain(
        await manager.save(
          manager.create(
            RefreshTokenEntity,
            champsDuJetonDeRafraichissement(token),
          ),
        ),
      );
    });
  }

  findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.trouver({ tokenHash });
  }

  revokeByUserId(userId: string): Promise<void> {
    return this.repo.manager.transaction(async (manager) => {
      await this.verrouillerLeCompte(manager, userId);
      await manager.update(
        RefreshTokenEntity,
        { userId },
        { revoked: true, rotationGraceUntil: null },
      );
    });
  }

  async rotateById(id: string, graceUntil: Date): Promise<boolean> {
    return aAffecte(
      await this.repo.update(
        { id, revoked: false },
        { revoked: true, rotationGraceUntil: graceUntil },
      ),
    );
  }

  async purgeExpired(): Promise<number> {
    return lignesAffectees(
      await this.repo.delete([
        { revoked: true, createdAt: poseeIlYAPlusDe(SEPT_JOURS_MS) },
        { expiresAt: LessThan(new Date()) },
      ]),
    );
  }

  private verrouillerLeCompte(
    manager: EntityManager,
    userId: string,
  ): Promise<void> {
    return verrouillerJusquALaFinDeLaTransaction(
      manager,
      `${this.repo.metadata.tableName}:${userId}`,
    );
  }

  protected toDomain(entity: RefreshTokenEntity): RefreshToken {
    return {
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      revoked: entity.revoked,
      rotationGraceUntil: entity.rotationGraceUntil,
      createdAt: entity.createdAt,
    };
  }
}
