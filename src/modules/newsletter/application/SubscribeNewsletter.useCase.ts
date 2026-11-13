import { Inject, Injectable, Logger } from '@nestjs/common';
import { enArrierePlan } from '../../../common/application/en-arriere-plan';
import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import { aHeureFixe } from '../../../common/application/plancher-de-latence';
import type { INewsletterMailer } from '../domain/INewsletterMailer';
import type { INewsletterRepository } from '../domain/INewsletterRepository';
import {
  type DemandeDAbonnement,
  demandeDAbonnement,
  type NewsletterSubscriber,
  nouvelAbonne,
  nouveauLien,
} from '../domain/NewsletterSubscriber';
import { NEWSLETTER_MAILER, NEWSLETTER_REPOSITORY } from '../domain/token';
import type { SubscribeNewsletterCommand } from './dto/SubscribeNewsletter.command';

type Envoi = (mailer: INewsletterMailer) => Promise<void>;

const DELAI_ENTRE_DEUX_MAILS_MS = 10 * 60_000;

function dansLeDelai(abonne: NewsletterSubscriber, maintenant: Date): boolean {
  return (
    abonne.dernierMailLe !== null &&
    maintenant.getTime() - abonne.dernierMailLe.getTime() <
      DELAI_ENTRE_DEUX_MAILS_MS
  );
}

export interface ReponseDAbonnement {
  readonly message: string;
}

export const REPONSES_D_ABONNEMENT: Readonly<
  Record<SupportedLocale, ReponseDAbonnement>
> = {
  fr: {
    message:
      'Si cette adresse peut recevoir la newsletter, un email de confirmation vient de partir. Si vous ne recevez rien d’ici quelques minutes, réessayez dans 10 minutes.',
  },
  en: {
    message:
      'If this address can receive the newsletter, a confirmation email has just been sent. If you receive nothing within a few minutes, try again in 10 minutes.',
  },
};

@Injectable()
export class SubscribeNewsletterUseCase {
  private readonly logger = new Logger(SubscribeNewsletterUseCase.name);

  constructor(
    @Inject(NEWSLETTER_REPOSITORY)
    private readonly depot: INewsletterRepository,
    @Inject(NEWSLETTER_MAILER)
    private readonly mailer: INewsletterMailer,
  ) {}

  execute(commande: SubscribeNewsletterCommand): Promise<ReponseDAbonnement> {
    return aHeureFixe(
      () => this.inscrire(commande),
      REPONSES_D_ABONNEMENT[commande.locale],
      'Newsletter subscription failed',
      this.logger,
    );
  }

  private async inscrire(
    commande: SubscribeNewsletterCommand,
  ): Promise<ReponseDAbonnement> {
    const demande = demandeDAbonnement(commande, new Date());
    const envoi = await this.depot.sousVerrouDeLaBoite(demande.email, (depot) =>
      preparerLEnvoi(depot, demande),
    );
    if (envoi !== null) {
      enArrierePlan(envoi(this.mailer), 'Newsletter email failed', this.logger);
    }
    return REPONSES_D_ABONNEMENT[commande.locale];
  }
}

async function preparerLEnvoi(
  depot: INewsletterRepository,
  demande: DemandeDAbonnement,
): Promise<Envoi | null> {
  const connu = await depot.trouverParBoite(demande.boite);
  if (connu === null) {
    await depot.creer(nouvelAbonne(demande));
    return lienDeConfirmation(depot, demande, demande.email);
  }
  if (dansLeDelai(connu, demande.recueLe)) {
    return null;
  }
  await depot.mettreAJour({ ...connu, dernierMailLe: demande.recueLe });
  if (connu.status === 'confirmed' && connu.locale === demande.locale) {
    return (mailer) =>
      mailer.envoyerDejaAbonne({
        email: connu.email,
        locale: connu.locale,
        jetonDeDesabonnement: connu.jetonDeDesabonnement,
      });
  }
  return lienDeConfirmation(depot, demande, connu.email);
}

async function lienDeConfirmation(
  depot: INewsletterRepository,
  demande: DemandeDAbonnement,
  destinataire: string,
): Promise<Envoi> {
  const lien = nouveauLien(demande);
  await depot.enregistrerLeLien(lien);
  return (mailer) =>
    mailer.envoyerLaConfirmation({
      email: destinataire,
      locale: lien.locale,
      jeton: lien.jeton,
      expireLe: lien.expireLe,
    });
}
