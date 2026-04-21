/**
 * Commande d'inscription a la newsletter. Payload immuable passe par le
 * controller au use-case — decouple le DTO HTTP du contrat applicatif.
 */
export interface SubscribeNewsletterCommand {
  email: string;
  firstName?: string;
  locale: string;
  sourceFormationSlug: string;
  termsVersion: string;
  termsAcceptedAt: Date;
}
