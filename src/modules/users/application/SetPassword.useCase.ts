import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { UserNotFoundError } from '../../../common/domain/errors/UserNotFoundError';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { User } from '../domain/User';
import type { SetPasswordCommand } from './dto/SetPassword.command';
import { PasswordService } from './services/PasswordService';

/** Definit un mot de passe pour un compte Google-only connecte. */
@Injectable()
export class SetPasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(dto: SetPasswordCommand): Promise<User> {
    const user = await this.usersRepository.findById(dto.userId);

    if (!user) {
      throw new UserNotFoundError(`User with id ${dto.userId} was not found`);
    }

    if (!user.isActive) {
      throw new InvalidCredentialsError('Inactive user cannot set password');
    }

    if (user.passwordHash) {
      throw new ResourceConflictError('Password is already configured');
    }

    const passwordHash = await this.passwordService.hash(dto.newPassword);

    return this.usersRepository.update(user.id as string, {
      passwordHash,
      updatedOrCreatedBy: dto.updatedOrCreatedBy ?? user.updatedOrCreatedBy,
      updatedAt: new Date(),
    });
  }
}
