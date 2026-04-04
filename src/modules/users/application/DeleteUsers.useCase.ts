import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundError } from '../../../common/domain/errors/UserNotFoundError';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { User } from '../domain/User';

/** Desactive un utilisateur par son identifiant (suppression logique). */
@Injectable()
export class DeleteUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
  ) {}

  async execute(id: string): Promise<User> {
    const existing = await this.repo.findById(id);

    if (!existing) {
      throw new UserNotFoundError(`User with id ${id} was not found`);
    }

    return this.repo.deactivate(id);
  }
}
