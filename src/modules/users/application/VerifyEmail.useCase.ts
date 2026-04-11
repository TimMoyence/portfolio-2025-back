import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import type { IEmailVerificationTokensRepository } from '../domain/IEmailVerificationTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { DEFAULT_SELF_REGISTRATION_ROLES } from '../domain/roles';
import {
  EMAIL_VERIFICATION_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from '../domain/token';

export interface VerifyEmailResult {
  message: string;
}

/**
 * Verifie l'adresse email d'un utilisateur via un token de verification.
 * Marque emailVerified=true, attribue les roles par defaut et supprime le token.
 */
@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(EMAIL_VERIFICATION_TOKENS_REPOSITORY)
    private readonly emailVerificationTokensRepo: IEmailVerificationTokensRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepo: IUsersRepository,
  ) {}

  async execute(token: string): Promise<VerifyEmailResult> {
    const stored =
      await this.emailVerificationTokensRepo.findActiveByToken(token);

    if (!stored) {
      throw new InvalidCredentialsError(
        'Token de verification invalide ou expire',
      );
    }

    const user = await this.usersRepo.findById(stored.userId);

    if (!user) {
      throw new InvalidCredentialsError(
        'Token de verification invalide ou expire',
      );
    }

    if (user.emailVerified) {
      // Deja verifie — supprimer le token et retourner succes
      await this.emailVerificationTokensRepo.deleteByUserId(stored.userId);
      return { message: 'Adresse email deja verifiee.' };
    }

    // Marquer comme verifie et attribuer les roles par defaut
    await this.usersRepo.update(user.id!, {
      emailVerified: true,
      roles: [...DEFAULT_SELF_REGISTRATION_ROLES],
    });

    // Supprimer tous les tokens de verification de cet utilisateur
    await this.emailVerificationTokensRepo.deleteByUserId(stored.userId);

    return { message: 'Adresse email verifiee avec succes.' };
  }
}
