import { randomUUID } from 'node:crypto';
import { emettreJeton } from '../../../common/domain/crypto/TokenHash';
import {
  requireEmail,
  requireLocale,
  requireText,
  requireValidDate,
} from '../../../common/domain/validation/domain-validators';
import { boiteDeLivraison } from '../../../common/domain/value-objects/boite-de-livraison';
import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';

const DUREE_DU_LIEN_MS = 7 * 24 * 60 * 60 * 1000;

export type StatutDAbonnement = 'pending' | 'confirmed' | 'unsubscribed';

export interface NewsletterSubscriber {
  readonly email: string;
  readonly boite: string;
  readonly locale: SupportedLocale;
  readonly status: StatutDAbonnement;
  readonly jetonDeDesabonnement: string;
  readonly termsVersion: string;
  readonly termsAcceptedAt: Date;
  readonly dernierMailLe: Date | null;
}

export interface LienDeConfirmation {
  readonly jeton: string;
  readonly boite: string;
  readonly locale: SupportedLocale;
  readonly expireLe: Date;
}

export interface DemandeDAbonnement {
  readonly email: string;
  readonly boite: string;
  readonly locale: SupportedLocale;
  readonly termsVersion: string;
  readonly termsAcceptedAt: Date;
  readonly recueLe: Date;
}

export function demandeDAbonnement(
  saisie: {
    readonly email: unknown;
    readonly locale: unknown;
    readonly termsVersion: unknown;
    readonly termsAcceptedAt: Date;
  },
  recueLe: Date,
): DemandeDAbonnement {
  const email = requireEmail(saisie.email, 'newsletter email');
  requireValidDate(saisie.termsAcceptedAt, 'termsAcceptedAt');
  return {
    email,
    boite: boiteDeLivraison(email),
    locale: requireLocale(saisie.locale, 'newsletter locale'),
    termsVersion: requireText(saisie.termsVersion, 'termsVersion', 1, 50),
    termsAcceptedAt: saisie.termsAcceptedAt,
    recueLe,
  };
}

export function nouvelAbonne(
  demande: DemandeDAbonnement,
): NewsletterSubscriber {
  return {
    email: demande.email,
    boite: demande.boite,
    locale: demande.locale,
    status: 'pending',
    jetonDeDesabonnement: randomUUID(),
    termsVersion: demande.termsVersion,
    termsAcceptedAt: demande.termsAcceptedAt,
    dernierMailLe: demande.recueLe,
  };
}

export function nouveauLien(demande: DemandeDAbonnement): LienDeConfirmation {
  return {
    jeton: emettreJeton().brut,
    boite: demande.boite,
    locale: demande.locale,
    expireLe: new Date(demande.recueLe.getTime() + DUREE_DU_LIEN_MS),
  };
}
