import { Inject } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { Users } from '../domain/Users';
import { CreateUserDto } from './dto/CreateUserDto';
import { UsersMapper } from './mappers/UsersMapper';

export class CreateUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private repo: IUsersRepository,
  ) {}
  async execute(dto: CreateUserDto): Promise<Users> {
    const user = UsersMapper.fromCreateDto(dto);
    return this.repo.create(user);
  }
}
