import { Inject } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { Users } from '../domain/Users';

export class ListOneUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
  ) {}

  execute(id: string): Promise<Users | null> {
    return this.repo.findById(id);
  }
}
