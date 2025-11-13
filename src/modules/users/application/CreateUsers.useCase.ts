import { Inject } from '@nestjs/common/decorators/core/inject.decorator';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { Users } from '../domain/Users';

export class CreateUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private repo: IUsersRepository,
  ) {}
  async execute(data: Users): Promise<Users> {
    return this.repo.create(data);
  }
}
