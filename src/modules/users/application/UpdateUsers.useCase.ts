import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import type { Users } from '../domain/Users';
import type { UpdateUserCommand } from './dto/UpdateUser.command';
import { UsersMapper } from './mappers/UsersMapper';
import { PasswordService } from './services/PasswordService';

/** Met a jour les informations d'un utilisateur existant. */
@Injectable()
export class UpdateUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(id: string, dto: UpdateUserCommand): Promise<Users> {
    const existing = await this.repo.findById(id);

    if (!existing) {
      throw new NotFoundException(`User with id ${id} was not found`);
    }

    const passwordHash = dto.password
      ? await this.passwordService.hash(dto.password)
      : undefined;
    const updatePayload = UsersMapper.fromUpdateCommand(dto, passwordHash);
    return this.repo.update(id, updatePayload);
  }
}
