import { Injectable } from '@nestjs/common';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { User } from '../domain/User';
import { CasDUsageMotDePasse } from './CasDUsageUtilisateurs';
import type { SetPasswordCommand } from './dto/SetPassword.command';

@Injectable()
export class SetPasswordUseCase extends CasDUsageMotDePasse {
  async execute(dto: SetPasswordCommand): Promise<User> {
    const user = await this.utilisateurExistant(dto.userId);

    if (user.passwordHash) {
      throw new ResourceConflictError('Password is already configured');
    }

    return this.remplacerMotDePasse(user, dto.newPassword, 'password-set');
  }
}
