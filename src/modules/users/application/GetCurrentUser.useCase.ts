import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../common/domain/errors/ResourceNotFoundError';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { User } from '../domain/User';

/** Recupere l'utilisateur actuellement connecte par son identifiant. */
@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
  ) {}

  async execute(userId: string): Promise<User> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('Utilisateur introuvable');
    }
    return user;
  }
}
