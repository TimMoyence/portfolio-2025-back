import { Injectable } from '@nestjs/common';
import type { User } from '../domain/User';
import { CasDUsageMotDePasse } from './CasDUsageUtilisateurs';
import type { UpdateUserCommand } from './dto/UpdateUser.command';
import { UsersMapper } from './mappers/UsersMapper';

@Injectable()
export class UpdateUsersUseCase extends CasDUsageMotDePasse {
  async execute(id: string, dto: UpdateUserCommand): Promise<User> {
    await this.utilisateurExistant(id);

    const passwordHash = dto.password
      ? await this.passwordService.hash(dto.password)
      : undefined;
    const updatePayload = UsersMapper.fromUpdateCommand(dto, passwordHash);
    return this.repo.update(id, updatePayload);
  }
}
