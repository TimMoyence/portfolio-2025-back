import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvalidInputError } from '../../../common/domain/errors/InvalidInputError';
import type { IEmailVerificationNotifier } from '../domain/IEmailVerificationNotifier';
import type { IEmailVerificationTokensRepository } from '../domain/IEmailVerificationTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import {
  EMAIL_VERIFICATION_NOTIFIER,
  EMAIL_VERIFICATION_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from '../domain/token';
import { dispatchVerificationEmail } from './services/email-verification-dispatch';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

export interface ResendVerificationResult {
  message: string;
}

@Injectable()
export class ResendVerificationEmailUseCase {
  private readonly logger = new Logger(ResendVerificationEmailUseCase.name);
  private readonly verificationUrlBase: string;
  private readonly genericMessage =
    'Si un compte non verifie existe avec cet email, un nouveau lien de verification a ete envoye.';

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepo: IUsersRepository,
    @Inject(EMAIL_VERIFICATION_TOKENS_REPOSITORY)
    private readonly emailVerificationTokensRepo: IEmailVerificationTokensRepository,
    @Inject(EMAIL_VERIFICATION_NOTIFIER)
    private readonly emailVerificationNotifier: IEmailVerificationNotifier,
    private readonly configService: ConfigService,
  ) {
    this.verificationUrlBase = this.configService.get<string>(
      'EMAIL_VERIFICATION_URL_BASE',
      'https://asilidesign.fr/verify-email',
    );
  }

  async execute(email: string): Promise<ResendVerificationResult> {
    const user = await this.usersRepo.findByEmail(email);

    if (!user || !user.id || !user.isActive) {
      return { message: this.genericMessage };
    }

    if (user.emailVerified) {
      return { message: this.genericMessage };
    }

    const recentCount =
      await this.emailVerificationTokensRepo.countRecentByUserId(
        user.id,
        RATE_LIMIT_WINDOW_MS,
      );

    if (recentCount >= RATE_LIMIT_MAX) {
      throw new InvalidInputError(
        'Trop de demandes de verification. Veuillez reessayer dans une heure.',
      );
    }

    await this.emailVerificationTokensRepo.deleteByUserId(user.id);

    await dispatchVerificationEmail({
      user,
      userId: user.id,
      verificationUrlBase: this.verificationUrlBase,
      tokensRepo: this.emailVerificationTokensRepo,
      notifier: this.emailVerificationNotifier,
      logger: this.logger,
      failureLogPrefix: 'Resend verification email failed',
    });

    return { message: this.genericMessage };
  }
}
