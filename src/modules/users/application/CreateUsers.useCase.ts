import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import type {
  CreateUserCommand,
  CreateUserResult,
} from './dto/CreateUser.command';
import { UsersMapper } from './mappers/UsersMapper';
import { EnvoiDeVerificationEmail } from './services/email-verification-dispatch';
import { PasswordService } from './services/PasswordService';

@Injectable()
export class CreateUsersUseCase {
  private readonly logger = new Logger(CreateUsersUseCase.name);

  constructor(
    @Inject(USERS_REPOSITORY)
    private repo: IUsersRepository,
    private readonly envoiDeVerification: EnvoiDeVerificationEmail,
    private readonly passwordService: PasswordService,
  ) {}

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
      await this.envoiDeVerification.envoyer(
        created,
        created.id,
        this.logger,
        'Email verification send failed',
      );
    }

    return { user: created };
  }
}
