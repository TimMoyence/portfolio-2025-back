import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import { REFRESH_TOKENS_REPOSITORY } from '../domain/token';

/**
 * Service CRON de nettoyage automatique des refresh tokens expirés.
 *
 * Exécuté quotidiennement à 3h du matin, il purge les tokens révoqués
 * depuis plus de 7 jours et les tokens dont la date d'expiration est dépassée.
 */
@Injectable()
export class RefreshTokenCleanupService {
  private readonly logger = new Logger(RefreshTokenCleanupService.name);

  constructor(
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokensRepo: IRefreshTokensRepository,
  ) {}

  /** Purge les refresh tokens expirés ou révoqués depuis plus de 7 jours. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredTokens(): Promise<void> {
    const count = await this.refreshTokensRepo.purgeExpired();
    this.logger.log(`Purgé ${count} refresh token(s) expiré(s)`);
  }
}
