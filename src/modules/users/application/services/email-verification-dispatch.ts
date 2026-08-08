import { Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { IEmailVerificationNotifier } from '../../domain/IEmailVerificationNotifier';
import type { IEmailVerificationTokensRepository } from '../../domain/IEmailVerificationTokens.repository';
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

export async function dispatchVerificationEmail(options: {
  user: User;
  userId: string;
  verificationUrlBase: string;
  tokensRepo: IEmailVerificationTokensRepository;
  notifier: IEmailVerificationNotifier;
  logger: Logger;
  failureLogPrefix: string;
}): Promise<void> {
  const rawToken = randomBytes(VERIFICATION_TOKEN_BYTES).toString('hex');

  await options.tokensRepo.create({
    userId: options.userId,
    token: rawToken,
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  });

  try {
    await options.notifier.sendVerificationEmail({
      email: options.user.email,
      firstName: options.user.firstName,
      lastName: options.user.lastName,
      verificationUrl: buildVerificationUrl(
        options.verificationUrlBase,
        rawToken,
      ),
      expiresInMinutes: EMAIL_VERIFICATION_TTL_MINUTES,
    });
  } catch (error) {
    options.logger.error(
      `${options.failureLogPrefix} for ${options.user.email}: ${String(error)}`,
    );
  }
}
