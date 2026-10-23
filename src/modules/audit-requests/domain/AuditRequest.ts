import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import {
  provenanceConsignable,
  type Provenance,
} from '../../../common/domain/provenance';
import {
  requireEmail,
  requireLocale,
  requireText,
} from '../../../common/domain/validation/domain-validators';
import { PhoneNumber } from '../../../common/domain/value-objects/PhoneNumber';
import { adresseDuSite } from './AdresseDuSite';
import { AuditLocale } from './audit-locale.util';

export const METHODES_DE_CONTACT = Object.freeze(['EMAIL', 'PHONE'] as const);

export const HEURES_DE_VALIDITE_D_UNE_CONFIRMATION = 24;

export const VALIDITE_D_UNE_CONFIRMATION_MS =
  HEURES_DE_VALIDITE_D_UNE_CONFIRMATION * 60 * 60 * 1000;
export type MethodeDeContact = (typeof METHODES_DE_CONTACT)[number];

export interface CreateAuditRequestProps extends Provenance {
  websiteName: string;
  contactMethod: MethodeDeContact;
  contactValue: string;
  locale: AuditLocale;
}

export class AuditRequest {
  id?: string;
  websiteName: string;
  contactMethod: MethodeDeContact;
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
    adresseDuSite(websiteName);
    const locale = requireLocale(props.locale, 'audit locale');

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
      contactValue = requireEmail(rawContact, 'audit contact email');
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
    Object.assign(request, provenanceConsignable(props));

    return request;
  }
}
