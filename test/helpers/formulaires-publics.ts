import { AuditRequestRequestDto } from '../../src/modules/audit-requests/interfaces/dto/audit-request.request.dto';
import { ContactRequestDto } from '../../src/modules/contacts/interfaces/dto/contact.request.dto';
import { JoinSessionRequestDto } from '../../src/modules/formations/interfaces/dto/join-session.request.dto';
import { RequestToolkitRequestDto } from '../../src/modules/lead-magnets/interfaces/dto/request-toolkit.request.dto';
import { SubscribeNewsletterRequestDto } from '../../src/modules/newsletter/interfaces/dto/subscribe-newsletter.request.dto';

export type FormulaireNomme = readonly [string, new () => object];

export const FORMULAIRES_PUBLICS_A_ADRESSE: readonly FormulaireNomme[] = [
  ['le contact', ContactRequestDto],
  ['la seance', JoinSessionRequestDto],
  ['la boite a outils', RequestToolkitRequestDto],
  ['la newsletter', SubscribeNewsletterRequestDto],
];

export const FORMULAIRES_PUBLICS: readonly FormulaireNomme[] = [
  ['la demande d audit', AuditRequestRequestDto],
  ...FORMULAIRES_PUBLICS_A_ADRESSE,
];
