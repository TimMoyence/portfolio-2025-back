import { Inject, NotFoundException } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { Users } from '../domain/Users';

export class DeleteUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
  ) {}

  async execute(id: string): Promise<Users> {
    const existing = await this.repo.findById(id);

    if (!existing) {
      throw new NotFoundException(`User with id ${id} was not found`);
    }

    return this.repo.deactivate(id);
  }
}
