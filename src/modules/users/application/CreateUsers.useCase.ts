import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { DomainError } from '../../../common/domain/errors/DomainError';
import { AcceptBudgetInvitationUseCase } from '../../budget/application/services/AcceptBudgetInvitation.useCase';
import {
  InvalidInvitationTokenError,
  InvitationAlreadyConsumedError,
  InvitationEmailMismatchError,
  InvitationExpiredError,
  InvitationRevokedError,
} from '../../budget/domain/errors/InvitationErrors';
import type { IEmailVerificationNotifier } from '../domain/IEmailVerificationNotifier';
import type { IEmailVerificationTokensRepository } from '../domain/IEmailVerificationTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import {
  EMAIL_VERIFICATION_NOTIFIER,
  EMAIL_VERIFICATION_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from '../domain/token';
import { User } from '../domain/User';
import type {
  CreateUserCommand,
  CreateUserResult,
} from './dto/CreateUser.command';
import { UsersMapper } from './mappers/UsersMapper';
import { PasswordService } from './services/PasswordService';

/** Duree de validite du token de verification email : 24 heures. */
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Orchestre la creation d'un utilisateur avec hachage du mot de passe.
 * Apres creation, genere un token de verification email et envoie
 * un email de confirmation. Le compte est cree avec emailVerified=false
 * et les roles ne sont attribues qu'apres verification.
 */
@Injectable()
export class CreateUsersUseCase {
  private readonly logger = new Logger(CreateUsersUseCase.name);
  private readonly verificationUrlBase: string;

  constructor(
    @Inject(USERS_REPOSITORY)
    private repo: IUsersRepository,
    @Inject(EMAIL_VERIFICATION_TOKENS_REPOSITORY)
    private readonly emailVerificationTokensRepo: IEmailVerificationTokensRepository,
    @Inject(EMAIL_VERIFICATION_NOTIFIER)
    private readonly emailVerificationNotifier: IEmailVerificationNotifier,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => AcceptBudgetInvitationUseCase))
    private readonly acceptBudgetInvitation: AcceptBudgetInvitationUseCase,
  ) {
    this.verificationUrlBase = this.configService.get<string>(
      'EMAIL_VERIFICATION_URL_BASE',
      'https://asilidesign.fr/verify-email',
    );
  }

  async execute(dto: CreateUserCommand): Promise<CreateUserResult> {
    const passwordHash = await this.passwordService.hash(dto.password);
    const updatedOrCreatedBy = dto.updatedOrCreatedBy ?? 'self-registration';
    const isSelfRegistration = updatedOrCreatedBy === 'self-registration';

    // Inscription publique : pas de roles avant verification email
    const roles = isSelfRegistration ? [] : (dto.roles ?? []);

    const user = UsersMapper.fromCreateCommand(
      { ...dto, updatedOrCreatedBy, roles },
      passwordHash,
    );
    const created = await this.repo.create(user);

    // Envoyer un email de verification pour les inscriptions publiques
    if (isSelfRegistration && created.id) {
      await this.sendVerificationEmail(created);
    }

    // Auto-acceptation d'invitation budget (magic-link). Optionnel : si une
    // erreur metier connue est levee (token invalide, expire, mismatch, etc.)
    // on log + retourne un warning sans faire echouer l'inscription. Les
    // erreurs techniques (DB, reseau) sont re-throw pour que l'orchestrateur
    // amont les traite normalement.
    const inviteWarning = await this.tryAcceptInvitation(dto, created);

    return { user: created, inviteWarning };
  }

  /**
   * Tente d'auto-accepter une invitation budget si `dto.inviteToken` est
   * fourni. Retourne `null` si pas de token ou si l'acceptation reussit.
   * Retourne un warning si une erreur metier d'invitation est levee.
   */
  private async tryAcceptInvitation(
    dto: CreateUserCommand,
    created: User,
  ): Promise<{ code: string; message: string } | null> {
    if (!dto.inviteToken || !created.id) {
      return null;
    }
    try {
      await this.acceptBudgetInvitation.execute({
        tokenClear: dto.inviteToken,
        acceptedByUserId: created.id,
        acceptedByEmail: created.email,
      });
      return null;
    } catch (error) {
      if (CreateUsersUseCase.isInvitationDomainError(error)) {
        this.logger.warn(
          `Invitation auto-accept failed for ${created.email}: ${error.message}`,
        );
        return {
          code:
            (error as DomainError & { code?: string }).code ??
            'INVITATION_ERROR',
          message: error.message,
        };
      }
      throw error;
    }
  }

  /**
   * Type-guard pour les erreurs metier d'invitation. Toute autre erreur
   * (technique, base de donnees) est re-throw pour ne pas masquer un bug.
   */
  private static isInvitationDomainError(error: unknown): error is DomainError {
    return (
      error instanceof InvalidInvitationTokenError ||
      error instanceof InvitationAlreadyConsumedError ||
      error instanceof InvitationRevokedError ||
      error instanceof InvitationExpiredError ||
      error instanceof InvitationEmailMismatchError
    );
  }

  /** Genere un token de verification et envoie l'email. */
  private async sendVerificationEmail(user: User): Promise<void> {
    const rawToken = randomBytes(32).toString('hex');

    await this.emailVerificationTokensRepo.create({
      userId: user.id!,
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
        `Email verification send failed for ${user.email}: ${String(error)}`,
      );
    }
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
