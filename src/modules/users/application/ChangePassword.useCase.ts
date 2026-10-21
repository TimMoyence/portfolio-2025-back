import { Injectable } from '@nestjs/common';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { MotDePasseActuelIncorrectError } from '../domain/MotDePasseActuelIncorrectError';
import { User } from '../domain/User';
import { CasDUsageMotDePasse } from './CasDUsageUtilisateurs';
import type { ChangePasswordCommand } from './dto/ChangePassword.command';

@Injectable()
export class ChangePasswordUseCase extends CasDUsageMotDePasse {
  async execute(dto: ChangePasswordCommand): Promise<User> {
    const user = await this.utilisateurExistant(dto.userId);

    if (!user.passwordHash) {
      throw new ResourceConflictError('No password set for this account');
    }

    const validCurrentPassword = await this.passwordService.verify(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!validCurrentPassword) {
      throw new MotDePasseActuelIncorrectError();
    }

    return this.remplacerMotDePasse(user, dto.newPassword, 'password-change');
  }
}
