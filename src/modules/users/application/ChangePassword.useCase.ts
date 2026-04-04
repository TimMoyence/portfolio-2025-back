import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import { UserNotFoundError } from '../../../common/domain/errors/UserNotFoundError';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { User } from '../domain/User';
import type { ChangePasswordCommand } from './dto/ChangePassword.command';
import { PasswordService } from './services/PasswordService';

/** Verifie le mot de passe actuel et applique le nouveau mot de passe de l'utilisateur. */
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(dto: ChangePasswordCommand): Promise<User> {
    const user = await this.repo.findById(dto.userId);

    if (!user) {
      throw new UserNotFoundError(`User with id ${dto.userId} was not found`);
    }

    if (!user.isActive) {
      throw new InvalidCredentialsError('Inactive user cannot change password');
    }

    if (!user.passwordHash) {
      throw new InvalidCredentialsError('No password set for this account');
    }

    const validCurrentPassword = await this.passwordService.verify(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!validCurrentPassword) {
      throw new InvalidCredentialsError('Current password is invalid');
    }

    const newPasswordHash = await this.passwordService.hash(dto.newPassword);

    return this.repo.update(user.id as string, {
      passwordHash: newPasswordHash,
      updatedOrCreatedBy: dto.updatedOrCreatedBy ?? user.updatedOrCreatedBy,
      updatedAt: new Date(),
    });
  }
}
