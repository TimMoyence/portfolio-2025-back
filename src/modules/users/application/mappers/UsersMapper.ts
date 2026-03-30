import { BadRequestException } from '@nestjs/common';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { Users } from '../../domain/Users';
import type { CreateUserCommand } from '../dto/CreateUser.command';
import type { UpdateUserCommand } from '../dto/UpdateUser.command';

export class UsersMapper {
  static fromCreateCommand(
    command: CreateUserCommand,
    passwordHash: string,
  ): Users {
    try {
      return Users.create({
        email: command.email,
        passwordHash,
        firstName: command.firstName,
        lastName: command.lastName,
        phone: command.phone ?? null,
        isActive: command.isActive ?? true,
        updatedOrCreatedBy: command.updatedOrCreatedBy ?? null,
      });
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /** @deprecated Utiliser fromCreateCommand a la place. */
  static fromCreateDto(dto: CreateUserCommand, passwordHash: string): Users {
    return this.fromCreateCommand(dto, passwordHash);
  }

  static fromUpdateCommand(
    command: UpdateUserCommand,
    passwordHash?: string,
  ): Partial<Users> {
    try {
      return Users.update({
        email: command.email,
        passwordHash,
        firstName: command.firstName,
        lastName: command.lastName,
        phone: command.phone,
        isActive: command.isActive,
        updatedOrCreatedBy: command.updatedOrCreatedBy,
      });
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /** @deprecated Utiliser fromUpdateCommand a la place. */
  static fromUpdateDto(
    dto: UpdateUserCommand,
    passwordHash?: string,
  ): Partial<Users> {
    return this.fromUpdateCommand(dto, passwordHash);
  }
}
