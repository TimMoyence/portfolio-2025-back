import { mapDomainValidation } from '../../../../common/application/mappers/map-domain-validation';
import { Users } from '../../domain/Users';
import type { CreateUserCommand } from '../dto/CreateUser.command';
import type { UpdateUserCommand } from '../dto/UpdateUser.command';

export class UsersMapper {
  static fromCreateCommand(
    command: CreateUserCommand,
    passwordHash: string,
  ): Users {
    return mapDomainValidation(() =>
      Users.create({
        email: command.email,
        passwordHash,
        firstName: command.firstName,
        lastName: command.lastName,
        phone: command.phone ?? null,
        isActive: command.isActive ?? true,
        roles: command.roles ?? [],
        updatedOrCreatedBy: command.updatedOrCreatedBy ?? null,
      }),
    );
  }

  /** @deprecated Utiliser fromCreateCommand a la place. */
  static fromCreateDto(dto: CreateUserCommand, passwordHash: string): Users {
    return this.fromCreateCommand(dto, passwordHash);
  }

  static fromUpdateCommand(
    command: UpdateUserCommand,
    passwordHash?: string,
  ): Partial<Users> {
    return mapDomainValidation(() =>
      Users.update({
        email: command.email,
        passwordHash,
        firstName: command.firstName,
        lastName: command.lastName,
        phone: command.phone,
        isActive: command.isActive,
        updatedOrCreatedBy: command.updatedOrCreatedBy,
      }),
    );
  }

  /** @deprecated Utiliser fromUpdateCommand a la place. */
  static fromUpdateDto(
    dto: UpdateUserCommand,
    passwordHash?: string,
  ): Partial<Users> {
    return this.fromUpdateCommand(dto, passwordHash);
  }
}
