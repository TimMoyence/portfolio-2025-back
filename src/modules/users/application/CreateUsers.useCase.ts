import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { dispatchVerificationEmail } from './services/email-verification-dispatch';
import { PasswordService } from './services/PasswordService';

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

    const roles = isSelfRegistration ? [] : (dto.roles ?? []);

    const user = UsersMapper.fromCreateCommand(
      { ...dto, updatedOrCreatedBy, roles },
      passwordHash,
    );
    const created = await this.repo.create(user);

    if (isSelfRegistration && created.id) {
      await this.sendVerificationEmail(created);
    }

    return { user: created };
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    await dispatchVerificationEmail({
      user,
      userId: user.id!,
      verificationUrlBase: this.verificationUrlBase,
      tokensRepo: this.emailVerificationTokensRepo,
      notifier: this.emailVerificationNotifier,
      logger: this.logger,
      failureLogPrefix: 'Email verification send failed',
    });
  }
}
