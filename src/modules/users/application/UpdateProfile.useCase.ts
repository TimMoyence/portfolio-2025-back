import { Injectable } from '@nestjs/common';
import type { User } from '../domain/User';
import { CasDUsageUtilisateurs } from './CasDUsageUtilisateurs';
import type { UpdateProfileCommand } from './dto/UpdateProfile.command';
import { UsersMapper } from './mappers/UsersMapper';

@Injectable()
export class UpdateProfileUseCase extends CasDUsageUtilisateurs {
  async execute(userId: string, command: UpdateProfileCommand): Promise<User> {
    await this.utilisateurExistant(userId);

    const updatePayload = UsersMapper.fromUpdateCommand({
      firstName: command.firstName,
      lastName: command.lastName,
      phone: command.phone,
      updatedOrCreatedBy: 'self-update',
    });

    return this.repo.update(userId, updatePayload);
  }
}
