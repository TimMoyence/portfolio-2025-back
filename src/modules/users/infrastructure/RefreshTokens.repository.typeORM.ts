import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, IsNull, LessThan, Not, Repository } from 'typeorm';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { RefreshToken } from '../domain/RefreshToken';
import { RefreshTokenEntity } from './entities/RefreshToken.entity';
import { champsDuJeton, enregistrerJeton } from './jetons.typeorm';

@Injectable()
export class RefreshTokensRepositoryTypeORM implements IRefreshTokensRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repo: Repository<RefreshTokenEntity>,
  ) {}

  create(token: RefreshToken): Promise<RefreshToken> {
    return this.enregistrer(this.repo, token);
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
      return this.enregistrer(manager.getRepository(RefreshTokenEntity), token);
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const entity = await this.repo.findOne({
      where: { tokenHash },
    });

    return entity ? this.toDomain(entity) : null;
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
    const result = await this.repo.update(
      { id, revoked: false },
      { revoked: true, rotationGraceUntil: graceUntil },
    );

    return result.affected === 1;
  }

  async purgeExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.repo.delete([
      { revoked: true, createdAt: LessThan(cutoff) },
      { expiresAt: LessThan(new Date()) },
    ]);
    return typeof result.affected === 'number' ? result.affected : 0;
  }

  private async verrouillerLeCompte(
    manager: EntityManager,
    userId: string,
  ): Promise<void> {
    await manager.query(
      `SELECT 1 FROM "users" WHERE "id" = $1 FOR NO KEY UPDATE`,
      [userId],
    );
  }

  private enregistrer(
    repo: Repository<RefreshTokenEntity>,
    token: RefreshToken,
  ): Promise<RefreshToken> {
    return enregistrerJeton(
      repo,
      {
        ...champsDuJeton(token),
        revoked: token.revoked,
        rotationGraceUntil: token.rotationGraceUntil ?? null,
      },
      (entite) => this.toDomain(entite),
    );
  }

  private toDomain(entity: RefreshTokenEntity): RefreshToken {
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
