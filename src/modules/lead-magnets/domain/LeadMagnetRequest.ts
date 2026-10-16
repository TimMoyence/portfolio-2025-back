import {
  requireEmail,
  requireLocale,
  requireText,
  requireValidDate,
} from '../../../common/domain/validation/domain-validators';
import type { InteractionProfile } from './InteractionProfile';

export interface CreateLeadMagnetRequestProps {
  firstName: string;
  email: string;
  formationSlug: string;
  termsVersion: string;
  termsLocale: string;
  termsAcceptedAt: Date;
  profile?: InteractionProfile;
}

export class LeadMagnetRequest {
  id?: string;
  firstName: string;
  email: string;
  formationSlug: string;
  termsVersion: string;
  termsLocale: string;
  termsAcceptedAt: Date;
  accessToken?: string;
  profile?: InteractionProfile;
  createdAt?: Date;

  static create(props: CreateLeadMagnetRequestProps): LeadMagnetRequest {
    const email = requireEmail(props.email, 'lead magnet request email');
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
    const termsLocale = requireLocale(props.termsLocale, 'terms locale');
    requireValidDate(props.termsAcceptedAt, 'terms accepted');
    const request = new LeadMagnetRequest();
    request.firstName = firstName;
    request.email = email;
    request.formationSlug = formationSlug;
    request.termsVersion = termsVersion;
    request.termsLocale = termsLocale;
    request.termsAcceptedAt = props.termsAcceptedAt;
    request.profile = props.profile;
    return request;
  }
}
