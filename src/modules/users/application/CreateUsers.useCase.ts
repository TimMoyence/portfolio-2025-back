import { Inject } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { Users } from '../domain/Users';
import { CreateUserDto } from './dto/CreateUser.dto';
import { UsersMapper } from './mappers/UsersMapper';
import { PasswordService } from './services/PasswordService';

export class CreateUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private repo: IUsersRepository,
    private readonly passwordService: PasswordService,
  ) {}
  async execute(dto: CreateUserDto): Promise<Users> {
    const passwordHash = this.passwordService.hash(dto.password);
    const user = UsersMapper.fromCreateDto(dto, passwordHash);
    return this.repo.create(user);
  }
}
