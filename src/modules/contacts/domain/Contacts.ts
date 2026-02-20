import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { EmailAddress } from '../../../common/domain/value-objects/EmailAddress';
import { LocaleCode } from '../../../common/domain/value-objects/LocaleCode';
import { PhoneNumber } from '../../../common/domain/value-objects/PhoneNumber';

export interface CreateContactProps {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  subject: string;
  message: string;
  role: string;
  terms: boolean;
  termsVersion?: string;
  termsLocale?: string;
  termsAcceptedAt?: Date;
  termsMethod?: string;
}

export class Contacts {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  subject: string;
  message: string;
  role: string;
  terms: boolean;
  termsVersion?: string;
  termsLocale?: string;
  termsAcceptedAt?: Date;
  termsMethod?: string;

  static create(props: CreateContactProps): Contacts {
    const email = EmailAddress.parse(props.email);
    if (!email) {
      throw new DomainValidationError('Invalid contact email');
    }

    const phoneInput =
      typeof props.phone === 'string' ? props.phone.trim() : props.phone;
    const phone = PhoneNumber.parse(phoneInput);
    if (typeof phoneInput === 'string' && phoneInput.length > 0 && !phone) {
      throw new DomainValidationError('Invalid contact phone number');
    }

    const firstName = this.requireText(props.firstName, 'first name', 1, 50);
    const lastName = this.requireText(props.lastName, 'last name', 1, 50);
    const subject = this.requireText(props.subject, 'subject', 2, 100);
    const message = this.requireText(props.message, 'message', 10, 2000);
    const role = this.requireText(props.role, 'role', 2, 100);

    if (typeof props.terms !== 'boolean') {
      throw new DomainValidationError('Invalid terms flag');
    }

    const termsLocaleInput = this.optionalText(props.termsLocale, 10);
    const termsLocale = termsLocaleInput
      ? LocaleCode.parse(termsLocaleInput)?.value
      : undefined;
    if (termsLocaleInput && !termsLocale) {
      throw new DomainValidationError('Invalid terms locale');
    }

    if (props.termsAcceptedAt !== undefined) {
      if (
        !(props.termsAcceptedAt instanceof Date) ||
        Number.isNaN(props.termsAcceptedAt.getTime())
      ) {
        throw new DomainValidationError('Invalid terms accepted date');
      }
    }

    const contact = new Contacts();
    contact.email = email.value;
    contact.firstName = firstName;
    contact.lastName = lastName;
    contact.phone = phone?.value ?? null;
    contact.subject = subject;
    contact.message = message;
    contact.role = role;
    contact.terms = props.terms;
    contact.termsVersion = this.optionalText(props.termsVersion, 50);
    contact.termsLocale = termsLocale;
    contact.termsMethod = this.optionalText(props.termsMethod, 50);
    contact.termsAcceptedAt = props.termsAcceptedAt;

    return contact;
  }

  private static requireText(
    raw: string,
    field: string,
    min: number,
    max: number,
  ): string {
    if (typeof raw !== 'string') {
      throw new DomainValidationError(`Invalid contact ${field}`);
    }
    const trimmed = raw.trim();
    if (trimmed.length < min || trimmed.length > max) {
      throw new DomainValidationError(`Invalid contact ${field}`);
    }
    return trimmed;
  }

  private static optionalText(raw: unknown, max: number): string | undefined {
    if (raw === null || raw === undefined) return undefined;
    if (typeof raw !== 'string') return undefined;
    const trimmed = raw.trim();
    if (trimmed.length === 0) return undefined;
    if (trimmed.length > max) {
      throw new DomainValidationError('Invalid contact metadata');
    }
    return trimmed;
  }
}
