import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundError } from '../../../common/domain/errors/UserNotFoundError';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import type { User } from '../domain/User';
import { PasswordService } from './services/PasswordService';

@Injectable()
export abstract class CasDUsageUtilisateurs {
  constructor(
    @Inject(USERS_REPOSITORY)
    protected readonly repo: IUsersRepository,
  ) {}

  protected async utilisateurExistant(id: string): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new UserNotFoundError(`User with id ${id} was not found`);
    }
    return user;
  }
}

@Injectable()
export abstract class CasDUsageMotDePasse extends CasDUsageUtilisateurs {
  constructor(
    @Inject(USERS_REPOSITORY)
    repo: IUsersRepository,
    protected readonly passwordService: PasswordService,
  ) {
    super(repo);
  }
}
