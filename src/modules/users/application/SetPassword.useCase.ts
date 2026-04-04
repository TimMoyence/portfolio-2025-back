import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { Users } from '../domain/Users';
import type { SetPasswordCommand } from './dto/SetPassword.command';
import { PasswordService } from './services/PasswordService';

/** Definit un mot de passe pour un compte Google-only connecte. */
@Injectable()
export class SetPasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(dto: SetPasswordCommand): Promise<Users> {
    const user = await this.usersRepository.findById(dto.userId);

    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} was not found`);
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Inactive user cannot set password');
    }

    if (user.passwordHash) {
      throw new ConflictException('Password is already configured');
    }

    const passwordHash = await this.passwordService.hash(dto.newPassword);

    return this.usersRepository.update(user.id as string, {
      passwordHash,
      updatedOrCreatedBy: dto.updatedOrCreatedBy ?? user.updatedOrCreatedBy,
      updatedAt: new Date(),
    });
  }
}
