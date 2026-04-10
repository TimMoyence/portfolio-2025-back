import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { requireText } from '../../../common/domain/validation/domain-validators';
import { EmailAddress } from '../../../common/domain/value-objects/EmailAddress';

export interface CreateLeadMagnetRequestProps {
  firstName: string;
  email: string;
  formationSlug: string;
  termsVersion: string;
  termsLocale: string;
  termsAcceptedAt: Date;
}

/** Entite domaine representant une demande de lead magnet (boite a outils). */
export class LeadMagnetRequest {
  id?: string;
  firstName: string;
  email: string;
  formationSlug: string;
  termsVersion: string;
  termsLocale: string;
  termsAcceptedAt: Date;
  createdAt?: Date;

  static create(props: CreateLeadMagnetRequestProps): LeadMagnetRequest {
    const email = EmailAddress.parse(props.email);
    if (!email) {
      throw new DomainValidationError('Invalid lead magnet request email');
    }
    const firstName = requireText(
      props.firstName,
      'lead magnet first name',
      1,
      50,
    );
    const formationSlug = requireText(
      props.formationSlug,
      'formation slug',
      1,
      100,
    );
    const termsVersion = requireText(
      props.termsVersion,
      'terms version',
      1,
      50,
    );
    const termsLocale = requireText(props.termsLocale, 'terms locale', 1, 10);
    if (
      !(props.termsAcceptedAt instanceof Date) ||
      Number.isNaN(props.termsAcceptedAt.getTime())
    ) {
      throw new DomainValidationError('Invalid terms accepted date');
    }
    const request = new LeadMagnetRequest();
    request.firstName = firstName;
    request.email = email.value;
    request.formationSlug = formationSlug;
    request.termsVersion = termsVersion;
    request.termsLocale = termsLocale;
    request.termsAcceptedAt = props.termsAcceptedAt;
    return request;
  }
}
