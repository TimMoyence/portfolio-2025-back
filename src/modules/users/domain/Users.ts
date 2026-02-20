import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { EmailAddress } from '../../../common/domain/value-objects/EmailAddress';
import { PhoneNumber } from '../../../common/domain/value-objects/PhoneNumber';

export interface CreateUserProps {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive?: boolean;
  updatedOrCreatedBy?: string | null;
}

export interface UpdateUserProps {
  email?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  isActive?: boolean;
  updatedOrCreatedBy?: string | null;
}

export class Users {
  id?: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  updatedOrCreatedBy: string | null;

  static create(props: CreateUserProps): Users {
    const email = EmailAddress.parse(props.email);
    if (!email) {
      throw new DomainValidationError('Invalid user email');
    }

    if (typeof props.passwordHash !== 'string' || props.passwordHash.length < 1) {
      throw new DomainValidationError('Invalid user password hash');
    }

    const firstName = this.requireName(props.firstName, 'first name');
    const lastName = this.requireName(props.lastName, 'last name');

    const phoneInput =
      typeof props.phone === 'string' ? props.phone.trim() : props.phone;
    const phone = PhoneNumber.parse(phoneInput);
    if (typeof phoneInput === 'string' && phoneInput.length > 0 && !phone) {
      throw new DomainValidationError('Invalid user phone number');
    }

    const user = new Users();
    user.email = email.value;
    user.passwordHash = props.passwordHash;
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone?.value ?? null;
    user.isActive = props.isActive ?? true;
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.updatedOrCreatedBy = this.optionalActor(props.updatedOrCreatedBy);

    return user;
  }

  static update(props: UpdateUserProps): Partial<Users> {
    const partial: Partial<Users> = {};

    if (props.email !== undefined) {
      const email = EmailAddress.parse(props.email);
      if (!email) {
        throw new DomainValidationError('Invalid user email');
      }
      partial.email = email.value;
    }

    if (props.passwordHash !== undefined) {
      if (typeof props.passwordHash !== 'string' || props.passwordHash.length < 1) {
        throw new DomainValidationError('Invalid user password hash');
      }
      partial.passwordHash = props.passwordHash;
    }

    if (props.firstName !== undefined) {
      partial.firstName = this.requireName(props.firstName, 'first name');
    }

    if (props.lastName !== undefined) {
      partial.lastName = this.requireName(props.lastName, 'last name');
    }

    if (props.phone !== undefined) {
      const phoneInput =
        typeof props.phone === 'string' ? props.phone.trim() : props.phone;
      const phone = PhoneNumber.parse(phoneInput);
      if (typeof phoneInput === 'string' && phoneInput.length > 0 && !phone) {
        throw new DomainValidationError('Invalid user phone number');
      }
      partial.phone = phone?.value ?? null;
    }

    if (props.isActive !== undefined) {
      if (typeof props.isActive !== 'boolean') {
        throw new DomainValidationError('Invalid user active flag');
      }
      partial.isActive = props.isActive;
    }

    if (props.updatedOrCreatedBy !== undefined) {
      partial.updatedOrCreatedBy = this.optionalActor(props.updatedOrCreatedBy);
    }

    partial.updatedAt = new Date();

    return partial;
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
