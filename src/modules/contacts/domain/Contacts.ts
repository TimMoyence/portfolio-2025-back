import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import {
  optionalPhone,
  optionalText,
  requireBoolean,
  requireEmail,
  requireText,
  requireValidDate,
} from '../../../common/domain/validation/domain-validators';
import { LocaleCode } from '../../../common/domain/value-objects/LocaleCode';

export type CreateContactProps = Omit<Contacts, 'id'>;

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
    const email = requireEmail(props.email, 'contact email');

    const phone = optionalPhone(props.phone, 'contact phone number');

    const firstName = requireText(props.firstName, 'contact first name', 1, 50);
    const lastName = requireText(props.lastName, 'contact last name', 1, 50);
    const subject = requireText(props.subject, 'contact subject', 2, 100);
    const message = requireText(props.message, 'contact message', 10, 2000);
    const role = requireText(props.role, 'contact role', 2, 100);

    const terms = requireBoolean(props.terms, 'terms flag');

    const termsLocaleInput = optionalText(
      props.termsLocale,
      'terms locale',
      10,
    );
    const termsLocale = termsLocaleInput
      ? LocaleCode.parse(termsLocaleInput)?.value
      : undefined;
    if (termsLocaleInput && !termsLocale) {
      throw new DomainValidationError('Invalid terms locale');
    }

    if (props.termsAcceptedAt !== undefined) {
      requireValidDate(props.termsAcceptedAt, 'terms accepted');
    }

    const contact = new Contacts();
    contact.email = email;
    contact.firstName = firstName;
    contact.lastName = lastName;
    contact.phone = phone;
    contact.subject = subject;
    contact.message = message;
    contact.role = role;
    contact.terms = terms;
    contact.termsVersion = optionalText(
      props.termsVersion,
      'contact terms version',
      50,
    );
    contact.termsLocale = termsLocale;
    contact.termsMethod = optionalText(
      props.termsMethod,
      'contact terms method',
      50,
    );
    contact.termsAcceptedAt = props.termsAcceptedAt;

    return contact;
  }
}
