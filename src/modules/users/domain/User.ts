import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { EmailAddress } from '../../../common/domain/value-objects/EmailAddress';
import { PhoneNumber } from '../../../common/domain/value-objects/PhoneNumber';

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

export interface UpdateUserProps {
  email?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  isActive?: boolean;
  roles?: string[];
  updatedOrCreatedBy?: string | null;
  googleId?: string | null;
  emailVerified?: boolean;
}

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
    const email = this.requireEmail(props.email);

    if (!props.googleId) {
      this.requirePasswordHash(props.passwordHash);
    }

    const firstName = this.requireName(props.firstName, 'first name');
    const lastName = this.requireName(props.lastName, 'last name');
    const phone = this.parsePhone(props.phone);

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
    user.updatedOrCreatedBy = this.optionalActor(props.updatedOrCreatedBy);

    return user;
  }

  static update(props: UpdateUserProps): Partial<User> {
    const partial: Partial<User> = {};

    if (props.email !== undefined) {
      partial.email = this.requireEmail(props.email);
    }

    if (props.passwordHash !== undefined) {
      partial.passwordHash = this.requirePasswordHash(props.passwordHash);
    }

    if (props.firstName !== undefined) {
      partial.firstName = this.requireName(props.firstName, 'first name');
    }

    if (props.lastName !== undefined) {
      partial.lastName = this.requireName(props.lastName, 'last name');
    }

    if (props.phone !== undefined) {
      partial.phone = this.parsePhone(props.phone);
    }

    if (props.isActive !== undefined) {
      partial.isActive = this.requireBoolean(
        props.isActive,
        'Invalid user active flag',
      );
    }

    if (props.roles !== undefined) {
      partial.roles = this.requireRoles(props.roles);
    }

    if (props.updatedOrCreatedBy !== undefined) {
      partial.updatedOrCreatedBy = this.optionalActor(props.updatedOrCreatedBy);
    }

    if (props.emailVerified !== undefined) {
      partial.emailVerified = this.requireBoolean(
        props.emailVerified,
        'Invalid email verified flag',
      );
    }

    partial.updatedAt = new Date();

    return partial;
  }

  private static requireEmail(raw: string): string {
    const email = EmailAddress.parse(raw);
    if (!email) {
      throw new DomainValidationError('Invalid user email');
    }
    return email.value;
  }

  private static requirePasswordHash(raw: unknown): string {
    if (typeof raw !== 'string' || raw.length < 1) {
      throw new DomainValidationError('Invalid user password hash');
    }
    return raw;
  }

  private static parsePhone(raw: string | null | undefined): string | null {
    const phoneInput = typeof raw === 'string' ? raw.trim() : raw;
    const phone = PhoneNumber.parse(phoneInput);
    if (typeof phoneInput === 'string' && phoneInput.length > 0 && !phone) {
      throw new DomainValidationError('Invalid user phone number');
    }
    return phone?.value ?? null;
  }

  private static requireBoolean(raw: unknown, message: string): boolean {
    if (typeof raw !== 'boolean') {
      throw new DomainValidationError(message);
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
    if (typeof raw !== 'string') {
      throw new DomainValidationError(`Invalid user ${field}`);
    }
    const trimmed = raw.trim();
    if (trimmed.length < 1) {
      throw new DomainValidationError(`Invalid user ${field}`);
    }
    return trimmed;
  }

  private static optionalActor(raw: unknown): string | null {
    if (raw === null || raw === undefined) return null;
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
