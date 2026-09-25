import { Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import { User } from '../domain/User';
import { CasDUsageMotDePasse } from './CasDUsageUtilisateurs';
import type { ChangePasswordCommand } from './dto/ChangePassword.command';

@Injectable()
export class ChangePasswordUseCase extends CasDUsageMotDePasse {
  async execute(dto: ChangePasswordCommand): Promise<User> {
    const user = await this.utilisateurExistant(dto.userId);

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
