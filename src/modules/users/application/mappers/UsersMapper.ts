import { mapDomainValidation } from '../../../../common/application/mappers/map-domain-validation';
import { User } from '../../domain/User';
import type { CreateUserCommand } from '../dto/CreateUser.command';
import type { UpdateUserCommand } from '../dto/UpdateUser.command';

export class UsersMapper {
  static fromCreateCommand(
    command: CreateUserCommand,
    passwordHash: string,
  ): User {
    return mapDomainValidation(() =>
      User.create({
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
  static fromCreateDto(dto: CreateUserCommand, passwordHash: string): User {
    return this.fromCreateCommand(dto, passwordHash);
  }

  static fromUpdateCommand(
    command: UpdateUserCommand,
    passwordHash?: string,
  ): Partial<User> {
    return mapDomainValidation(() =>
      User.update({
        email: command.email,
        passwordHash,
        firstName: command.firstName,
        lastName: command.lastName,
        phone: command.phone,
        isActive: command.isActive,
        roles: command.roles,
        updatedOrCreatedBy: command.updatedOrCreatedBy,
      }),
    );
  }

  /** @deprecated Utiliser fromUpdateCommand a la place. */
  static fromUpdateDto(
    dto: UpdateUserCommand,
    passwordHash?: string,
  ): Partial<User> {
    return this.fromUpdateCommand(dto, passwordHash);
  }

  /** Cree un utilisateur domaine a partir des donnees Google OAuth. */
  static fromGoogleAuth(props: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    roles: string[];
  }): User {
    return mapDomainValidation(() =>
      User.create({
        email: props.email,
        firstName: props.firstName,
        lastName: props.lastName,
        googleId: props.googleId,
        roles: props.roles,
        updatedOrCreatedBy: 'google-oauth',
      }),
    );
  }
}
