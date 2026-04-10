/** Commande pour demander l'envoi d'une boite a outils (lead magnet). */
export interface RequestToolkitCommand {
  firstName: string;
  email: string;
  formationSlug: string;
  termsVersion: string;
  termsLocale: string;
  termsAcceptedAt: Date;
}
