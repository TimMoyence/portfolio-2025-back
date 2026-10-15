import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import {
  optionalMetadata,
  optionalPhone,
  optionalText,
  requireBoolean,
  requireEmail,
  requireText,
} from '../../../common/domain/validation/domain-validators';

export const LONGUEUR_MAX_D_UN_NOM = 50;

export interface CreateUserProps {
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive?: boolean;
  roles?: string[];
  updatedOrCreatedBy?: string | null;
  googleId?: string | null;
  emailVerified?: boolean;
}

export type UpdateUserProps = Partial<CreateUserProps>;

export class User {
  id?: string;
  email: string;
  passwordHash: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  roles: string[];
  googleId: string | null;
  emailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  updatedOrCreatedBy: string | null;

  static create(props: CreateUserProps): User {
    const email = requireEmail(props.email, 'user email');

    if (!props.googleId) {
      this.requirePasswordHash(props.passwordHash);
    }

    const firstName = this.requireName(props.firstName, 'user first name');
    const lastName = props.googleId
      ? (optionalText(
          props.lastName,
          'user last name',
          LONGUEUR_MAX_D_UN_NOM,
        ) ?? '')
      : this.requireName(props.lastName, 'user last name');
    const phone = optionalPhone(props.phone, 'user phone number');

    const user = new User();
    user.email = email;
    user.passwordHash = props.passwordHash ?? null;
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    user.isActive = props.isActive ?? true;
    user.roles = Array.isArray(props.roles) ? props.roles : [];
    user.googleId = props.googleId ?? null;
    user.emailVerified = props.emailVerified ?? false;
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.updatedOrCreatedBy = optionalMetadata(props.updatedOrCreatedBy);

    return user;
  }

  static update(props: UpdateUserProps): Partial<User> {
    const partial: Partial<User> = {};

    if (props.email !== undefined) {
      partial.email = requireEmail(props.email, 'user email');
    }

    if (props.passwordHash !== undefined) {
      partial.passwordHash = this.requirePasswordHash(props.passwordHash);
    }

    if (props.firstName !== undefined) {
      partial.firstName = this.requireName(props.firstName, 'user first name');
    }

    if (props.lastName !== undefined) {
      partial.lastName = this.requireName(props.lastName, 'user last name');
    }

    if (props.phone !== undefined) {
      partial.phone = optionalPhone(props.phone, 'user phone number');
    }

    if (props.isActive !== undefined) {
      partial.isActive = requireBoolean(props.isActive, 'user active flag');
    }

    if (props.roles !== undefined) {
      partial.roles = this.requireRoles(props.roles);
    }

    if (props.updatedOrCreatedBy !== undefined) {
      partial.updatedOrCreatedBy = optionalMetadata(props.updatedOrCreatedBy);
    }

    if (props.emailVerified !== undefined) {
      partial.emailVerified = requireBoolean(
        props.emailVerified,
        'email verified flag',
      );
    }

    partial.updatedAt = new Date();

    return partial;
  }

  private static requirePasswordHash(raw: unknown): string {
    if (typeof raw !== 'string' || raw.length < 1) {
      throw new DomainValidationError('Invalid user password hash');
    }
    return raw;
  }

  private static requireRoles(raw: unknown): string[] {
    if (!Array.isArray(raw)) {
      throw new DomainValidationError('Invalid user roles');
    }
    return raw as string[];
  }

  private static requireName(raw: unknown, field: string): string {
    return requireText(raw, field, 1, LONGUEUR_MAX_D_UN_NOM);
  }
}
