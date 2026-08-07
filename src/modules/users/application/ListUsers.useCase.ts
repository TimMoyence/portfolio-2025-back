import { Inject, Injectable } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { User } from '../domain/User';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
  ) {}

  execute(): Promise<User[]> {
    return this.repo.findAll();
  }
}
