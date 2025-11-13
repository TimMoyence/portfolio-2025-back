import { Inject } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { Users } from '../domain/Users';

export class ListUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
  ) {}

  execute(): Promise<Users[]> {
    return this.repo.findAll();
  }
}
