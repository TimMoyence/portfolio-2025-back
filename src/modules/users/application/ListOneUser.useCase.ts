import { Inject, Injectable } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { User } from '../domain/User';

/** Recupere un utilisateur unique par son identifiant. */
@Injectable()
export class ListOneUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
  ) {}

  execute(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }
}
