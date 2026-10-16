import { Inject, Injectable, Logger } from '@nestjs/common';
import { aHeureFixe } from '../../../common/application/plancher-de-latence';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { EnvoiDeVerificationEmail } from './services/email-verification-dispatch';

export interface ResendVerificationResult {
  message: string;
}

@Injectable()
export class ResendVerificationEmailUseCase {
  private readonly logger = new Logger(ResendVerificationEmailUseCase.name);
  private readonly genericMessage =
    'Si un compte non verifie existe avec cet email, un nouveau lien de verification a ete envoye.';

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepo: IUsersRepository,
    private readonly envoiDeVerification: EnvoiDeVerificationEmail,
  ) {}

  execute(email: string): Promise<ResendVerificationResult> {
    return aHeureFixe(
      () => this.renvoyer(email),
      { message: this.genericMessage },
      'Resend verification request failed',
      this.logger,
    );
  }

  private async renvoyer(email: string): Promise<ResendVerificationResult> {
    const user = await this.usersRepo.findByEmail(email);

    if (!user || !user.id || !user.isActive || user.emailVerified) {
      return { message: this.genericMessage };
    }

    await this.envoiDeVerification.envoyer(
      user,
      user.id,
      this.logger,
      'Resend verification email failed',
    );

    return { message: this.genericMessage };
  }
}
