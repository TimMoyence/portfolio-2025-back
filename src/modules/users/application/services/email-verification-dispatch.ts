import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import type { IEmailVerificationNotifier } from '../../domain/IEmailVerificationNotifier';
import type { IEmailVerificationTokensRepository } from '../../domain/IEmailVerificationTokens.repository';
import {
  EMAIL_VERIFICATION_NOTIFIER,
  EMAIL_VERIFICATION_TOKENS_REPOSITORY,
} from '../../domain/token';
import type { User } from '../../domain/User';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

const EMAIL_VERIFICATION_TTL_MINUTES = EMAIL_VERIFICATION_TTL_MS / 60_000;
const VERIFICATION_TOKEN_BYTES = 32;

function buildVerificationUrl(base: string, rawToken: string): string {
  try {
    const url = new URL(base);
    url.searchParams.set('token', rawToken);
    return url.toString();
  } catch {
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}token=${encodeURIComponent(rawToken)}`;
  }
}

@Injectable()
export class EnvoiDeVerificationEmail {
  private readonly verificationUrlBase: string;

  constructor(
    @Inject(EMAIL_VERIFICATION_TOKENS_REPOSITORY)
    private readonly tokensRepo: IEmailVerificationTokensRepository,
    @Inject(EMAIL_VERIFICATION_NOTIFIER)
    private readonly notifier: IEmailVerificationNotifier,
    configService: ConfigService,
  ) {
    this.verificationUrlBase = configService.get<string>(
      'EMAIL_VERIFICATION_URL_BASE',
      'https://asilidesign.fr/verify-email',
    );
  }

  async envoyer(
    user: User,
    userId: string,
    logger: Logger,
    failureLogPrefix: string,
  ): Promise<void> {
    const rawToken = randomBytes(VERIFICATION_TOKEN_BYTES).toString('hex');

    await this.tokensRepo.create({
      userId,
      token: rawToken,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    });

    try {
      await this.notifier.sendVerificationEmail({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        verificationUrl: buildVerificationUrl(
          this.verificationUrlBase,
          rawToken,
        ),
        expiresInMinutes: EMAIL_VERIFICATION_TTL_MINUTES,
      });
    } catch (error) {
      logger.error(`${failureLogPrefix} for ${user.email}: ${String(error)}`);
    }
  }
}
