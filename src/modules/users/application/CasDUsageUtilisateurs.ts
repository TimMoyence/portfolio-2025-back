import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundError } from '../../../common/domain/errors/UserNotFoundError';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { REFRESH_TOKENS_REPOSITORY, USERS_REPOSITORY } from '../domain/token';
import { User, type CreateUserProps } from '../domain/User';
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
    @Inject(REFRESH_TOKENS_REPOSITORY)
    protected readonly refreshTokensRepo: IRefreshTokensRepository,
  ) {
    super(repo);
  }

  protected async remplacerMotDePasse(
    user: User,
    motDePasse: string,
    auteur: CreateUserProps['updatedOrCreatedBy'],
  ): Promise<User> {
    const enregistre = await this.enregistrerMotDePasse(
      user,
      motDePasse,
      auteur,
    );
    await this.refreshTokensRepo.revokeByUserId(user.id as string);
    return enregistre;
  }

  protected async enregistrerMotDePasse(
    user: User,
    motDePasse: string,
    auteur: CreateUserProps['updatedOrCreatedBy'],
  ): Promise<User> {
    const passwordHash = await this.passwordService.hash(motDePasse);
    return this.repo.update(
      user.id as string,
      User.update({ passwordHash, updatedOrCreatedBy: auteur }),
    );
  }
}
