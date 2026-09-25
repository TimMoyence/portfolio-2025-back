import { Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { User } from '../domain/User';
import { CasDUsageMotDePasse } from './CasDUsageUtilisateurs';
import type { SetPasswordCommand } from './dto/SetPassword.command';

@Injectable()
export class SetPasswordUseCase extends CasDUsageMotDePasse {
  async execute(dto: SetPasswordCommand): Promise<User> {
    const user = await this.utilisateurExistant(dto.userId);

    if (!user.isActive) {
      throw new InvalidCredentialsError('Inactive user cannot set password');
    }

    if (user.passwordHash) {
      throw new ResourceConflictError('Password is already configured');
    }

    const passwordHash = await this.passwordService.hash(dto.newPassword);

    return this.repo.update(user.id as string, {
      passwordHash,
      updatedOrCreatedBy: dto.updatedOrCreatedBy ?? user.updatedOrCreatedBy,
      updatedAt: new Date(),
    });
  }
}
