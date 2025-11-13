import { Inject, NotFoundException } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import type { Users } from '../domain/Users';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { UsersMapper } from './mappers/UsersMapper';
import { PasswordService } from './services/PasswordService';

export class UpdateUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(id: string, dto: UpdateUserDto): Promise<Users> {
    const existing = await this.repo.findById(id);

    if (!existing) {
      throw new NotFoundException(`User with id ${id} was not found`);
    }

    const passwordHash = dto.password
      ? this.passwordService.hash(dto.password)
      : undefined;
    const updatePayload = UsersMapper.fromUpdateDto(dto, passwordHash);
    return this.repo.update(id, updatePayload);
  }
}
