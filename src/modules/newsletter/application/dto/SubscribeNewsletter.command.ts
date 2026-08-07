export interface SubscribeNewsletterCommand {
  email: string;
  firstName?: string;
  locale: string;
  sourceFormationSlug: string;
  termsVersion: string;
  termsAcceptedAt: Date;
}
