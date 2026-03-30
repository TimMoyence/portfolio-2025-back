import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import {
  requireText,
  optionalMetadata,
} from '../../../common/domain/validation/domain-validators';
import { EmailAddress } from '../../../common/domain/value-objects/EmailAddress';
import { LocaleCode } from '../../../common/domain/value-objects/LocaleCode';
import { PhoneNumber } from '../../../common/domain/value-objects/PhoneNumber';
import { AuditLocale } from './audit-locale.util';

export interface CreateAuditRequestProps {
  websiteName: string;
  contactMethod: 'EMAIL' | 'PHONE';
  contactValue: string;
  locale: AuditLocale;
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}

/** Entite domaine representant une demande d'audit SEO. */
export class AuditRequest {
  id?: string;
  websiteName: string;
  contactMethod: 'EMAIL' | 'PHONE';
  contactValue: string;
  locale: AuditLocale;
  done?: boolean;
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;

  static create(props: CreateAuditRequestProps): AuditRequest {
    const websiteName = requireText(
      props.websiteName,
      'audit website name',
      2,
      200,
    );
    const locale = LocaleCode.resolve(props.locale, 'fr').value;

    if (props.contactMethod !== 'EMAIL' && props.contactMethod !== 'PHONE') {
      throw new DomainValidationError('Invalid audit contact method');
    }

    const rawContact = requireText(
      props.contactValue,
      'audit contact value',
      6,
      200,
    );
    let contactValue = rawContact;

    if (props.contactMethod === 'EMAIL') {
      const email = EmailAddress.parse(rawContact);
      if (!email) {
        throw new DomainValidationError('Invalid audit contact email');
      }
      contactValue = email.value;
    }

    if (props.contactMethod === 'PHONE') {
      const phone = PhoneNumber.parse(rawContact);
      if (!phone) {
        throw new DomainValidationError('Invalid audit contact phone number');
      }
      contactValue = phone.value;
    }

    const request = new AuditRequest();
    request.websiteName = websiteName;
    request.contactMethod = props.contactMethod;
    request.contactValue = contactValue;
    request.locale = locale;
    request.ip = optionalMetadata(props.ip);
    request.userAgent = optionalMetadata(props.userAgent);
    request.referer = optionalMetadata(props.referer);

    return request;
  }
}
