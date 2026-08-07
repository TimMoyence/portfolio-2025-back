import type { InteractionProfile } from '../../domain/InteractionProfile';

export interface RequestToolkitCommand {
  firstName: string;
  email: string;
  formationSlug: string;
  termsVersion: string;
  termsLocale: string;
  termsAcceptedAt: Date;
  profile?: InteractionProfile;
}
