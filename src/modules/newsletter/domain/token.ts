/**
 * Jetons d'injection du bounded context Newsletter. Conformes au
 * pattern des autres modules (LeadMagnets, Budget, etc.), ils isolent
 * les ports du domaine de leurs implementations d'infrastructure.
 */
export const NEWSLETTER_SUBSCRIBER_REPOSITORY = Symbol(
  'NEWSLETTER_SUBSCRIBER_REPOSITORY',
);
export const NEWSLETTER_MAILER = Symbol('NEWSLETTER_MAILER');
export const EMAIL_DRIP_SCHEDULER = Symbol('EMAIL_DRIP_SCHEDULER');
