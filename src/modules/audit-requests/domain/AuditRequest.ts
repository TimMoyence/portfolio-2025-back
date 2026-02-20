import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
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
    const websiteName = this.requireText(props.websiteName, 'website name', 2, 200);
    const locale = LocaleCode.resolve(props.locale, 'fr').value;

    if (props.contactMethod !== 'EMAIL' && props.contactMethod !== 'PHONE') {
      throw new DomainValidationError('Invalid audit contact method');
    }

    const rawContact = this.requireText(props.contactValue, 'contact value', 6, 200);
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
    request.ip = this.optionalMetadata(props.ip);
    request.userAgent = this.optionalMetadata(props.userAgent);
    request.referer = this.optionalMetadata(props.referer);

    return request;
  }

  private static requireText(
    raw: unknown,
    field: string,
    min: number,
    max: number,
  ): string {
    if (typeof raw !== 'string') {
      throw new DomainValidationError(`Invalid audit ${field}`);
    }
    const trimmed = raw.trim();
    if (trimmed.length < min || trimmed.length > max) {
      throw new DomainValidationError(`Invalid audit ${field}`);
    }
    return trimmed;
  }

  private static optionalMetadata(raw: unknown): string | null {
    if (raw === null || raw === undefined) return null;
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
