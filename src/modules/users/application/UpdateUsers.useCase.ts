import { Inject, NotFoundException } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import type { Users } from '../domain/Users';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { UsersMapper } from './mappers/UsersMapper';

export class UpdateUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
  ) {}

  async execute(id: string, dto: UpdateUserDto): Promise<Users> {
    const existing = await this.repo.findById(id);

    if (!existing) {
      throw new NotFoundException(`User with id ${id} was not found`);
    }

    const updatePayload = UsersMapper.fromUpdateDto(dto);
    return this.repo.update(id, updatePayload);
  }
}
