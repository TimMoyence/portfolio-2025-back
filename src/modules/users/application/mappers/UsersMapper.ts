import { mapDomainValidation } from '../../../../common/application/mappers/map-domain-validation';
import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';
import { User } from '../../domain/User';
import type { CreateUserCommand } from '../dto/CreateUser.command';
import type { UpdateProfileCommand } from '../dto/UpdateProfile.command';

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
        locale: command.locale,
      }),
    );
  }

  static fromProfileCommand(command: UpdateProfileCommand): Partial<User> {
    return mapDomainValidation(() =>
      User.update({
        firstName: command.firstName,
        lastName: command.lastName,
        phone: command.phone,
        locale: command.locale,
        updatedOrCreatedBy: 'self-update',
      }),
    );
  }

  static fromGoogleAuth(props: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    roles: string[];
    emailVerified?: boolean;
    locale?: SupportedLocale;
  }): User {
    return mapDomainValidation(() =>
      User.create({
        email: props.email,
        firstName: props.firstName,
        lastName: props.lastName,
        googleId: props.googleId,
        roles: props.roles,
        emailVerified: props.emailVerified ?? true,
        locale: props.locale,
        updatedOrCreatedBy: 'google-oauth',
      }),
    );
  }
}
