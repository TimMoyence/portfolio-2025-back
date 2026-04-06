import { Inject, Injectable } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { User } from '../domain/User';
import { DEFAULT_SELF_REGISTRATION_ROLES } from '../domain/roles';
import type { CreateUserCommand } from './dto/CreateUser.command';
import { UsersMapper } from './mappers/UsersMapper';
import { PasswordService } from './services/PasswordService';

/** Orchestre la creation d'un utilisateur avec hachage du mot de passe. */
@Injectable()
export class CreateUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private repo: IUsersRepository,
    private readonly passwordService: PasswordService,
  ) {}
  async execute(dto: CreateUserCommand): Promise<User> {
    const passwordHash = await this.passwordService.hash(dto.password);
    const updatedOrCreatedBy = dto.updatedOrCreatedBy ?? 'self-registration';
    const roles =
      updatedOrCreatedBy === 'self-registration'
        ? DEFAULT_SELF_REGISTRATION_ROLES
        : (dto.roles ?? []);
    const user = UsersMapper.fromCreateCommand(
      { ...dto, updatedOrCreatedBy, roles },
      passwordHash,
    );
    return this.repo.create(user);
  }
}
