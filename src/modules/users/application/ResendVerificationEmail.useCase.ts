import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { InvalidInputError } from '../../../common/domain/errors/InvalidInputError';
import type { IEmailVerificationNotifier } from '../domain/IEmailVerificationNotifier';
import type { IEmailVerificationTokensRepository } from '../domain/IEmailVerificationTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import {
  EMAIL_VERIFICATION_NOTIFIER,
  EMAIL_VERIFICATION_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from '../domain/token';

/** Duree de validite du token de verification email : 24 heures. */
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/** Rate limit : maximum 3 renvois par heure (en ms). */
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

export interface ResendVerificationResult {
  message: string;
}

/**
 * Renvoie un email de verification a un utilisateur non encore verifie.
 * Rate limited a 3 envois par heure pour eviter les abus.
 */
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

    // Reponse generique pour ne pas reveler l'existence d'un compte
    if (!user || !user.id || !user.isActive) {
      return { message: this.genericMessage };
    }

    if (user.emailVerified) {
      return { message: this.genericMessage };
    }

    // Rate limit check
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

    // Supprimer les anciens tokens et en creer un nouveau
    await this.emailVerificationTokensRepo.deleteByUserId(user.id);

    const rawToken = randomBytes(32).toString('hex');

    await this.emailVerificationTokensRepo.create({
      userId: user.id,
      token: rawToken,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    });

    try {
      await this.emailVerificationNotifier.sendVerificationEmail({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        verificationUrl: this.buildVerificationUrl(rawToken),
        expiresInMinutes: 24 * 60,
      });
    } catch (error) {
      this.logger.error(
        `Resend verification email failed for ${user.email}: ${String(error)}`,
      );
    }

    return { message: this.genericMessage };
  }

  private buildVerificationUrl(rawToken: string): string {
    try {
      const url = new URL(this.verificationUrlBase);
      url.searchParams.set('token', rawToken);
      return url.toString();
    } catch {
      const separator = this.verificationUrlBase.includes('?') ? '&' : '?';
      return `${this.verificationUrlBase}${separator}token=${encodeURIComponent(rawToken)}`;
    }
  }
}
