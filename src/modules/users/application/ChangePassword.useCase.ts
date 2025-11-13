import {
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { Users } from '../domain/Users';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
import { PasswordService } from './services/PasswordService';

export class ChangePasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(dto: ChangePasswordDto): Promise<Users> {
    const user = await this.repo.findById(dto.userId);

    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} was not found`);
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Inactive user cannot change password');
    }

    const validCurrentPassword = this.passwordService.verify(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!validCurrentPassword) {
      throw new UnauthorizedException('Current password is invalid');
    }

    const newPasswordHash = this.passwordService.hash(dto.newPassword);

    return this.repo.update(user.id as string, {
      passwordHash: newPasswordHash,
      updatedOrCreatedBy: dto.updatedOrCreatedBy ?? user.updatedOrCreatedBy,
      updatedAt: new Date(),
    });
  }
}
