import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import { REFRESH_TOKENS_REPOSITORY } from '../domain/token';

@Injectable()
export class RefreshTokenCleanupService {
  private readonly logger = new Logger(RefreshTokenCleanupService.name);

  constructor(
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokensRepo: IRefreshTokensRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredTokens(): Promise<void> {
    const count = await this.refreshTokensRepo.purgeExpired();
    this.logger.log(`Purgé ${count} refresh token(s) expiré(s)`);
  }
}
