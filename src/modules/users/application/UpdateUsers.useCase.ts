import { Injectable } from '@nestjs/common';
import type { User } from '../domain/User';
import { CasDUsageMotDePasse } from './CasDUsageUtilisateurs';
import type { UpdateUserCommand } from './dto/UpdateUser.command';
import { UsersMapper } from './mappers/UsersMapper';

@Injectable()
export class UpdateUsersUseCase extends CasDUsageMotDePasse {
  async execute(
    id: string,
    { password, ...champs }: UpdateUserCommand,
  ): Promise<User> {
    await this.utilisateurExistant(id);

    const misAJour = await this.repo.update(
      id,
      UsersMapper.fromUpdateCommand(champs),
    );
    return password
      ? this.remplacerMotDePasse(misAJour, password, champs.updatedOrCreatedBy)
      : misAJour;
  }
}
