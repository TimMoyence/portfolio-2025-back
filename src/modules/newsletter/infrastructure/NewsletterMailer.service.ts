import { Injectable } from '@nestjs/common';
import { safeHtml } from '../../../common/domain/texte/nettoyage/html-escape.util';
import { lienAvecJeton } from '../../../common/domain/liens/lien-avec-jeton';
import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import {
  type CorpsAvecBouton,
  corpsAvecBouton,
} from '../../../common/infrastructure/mail/corps/corps-avec-bouton';
import { ExpediteurSmtp } from '../../../common/infrastructure/mail/expediteur-smtp';
import { pageDuSite } from '../../../config/urls-publiques';
import type {
  ConfirmationAEnvoyer,
  INewsletterMailer,
  RappelDAbonnement,
} from '../domain/INewsletterMailer';

type Redaction = Omit<CorpsAvecBouton, 'lien'> & { readonly sujet: string };

const FORMAT_DE_DATE: Readonly<Record<SupportedLocale, string>> = {
  fr: 'fr-FR',
  en: 'en-GB',
};

function dateDuLien(locale: SupportedLocale, expireLe: Date): string {
  return new Intl.DateTimeFormat(FORMAT_DE_DATE[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  }).format(expireLe);
}

const CONFIRMATION: Readonly<
  Record<SupportedLocale, (expireLe: Date) => Redaction>
> = {
  fr: (expireLe) => ({
    sujet: 'Confirmez votre abonnement à la newsletter Asili Design',
    titre: safeHtml`Confirmez votre abonnement`,
    paragraphes: [
      'Vous avez demandé à recevoir par email chaque article publié sur asilidesign.fr.',
      `Ce lien est valable jusqu’au ${dateDuLien('fr', expireLe)}.`,
    ],
    bouton: 'Confirmer mon abonnement',
    pied: 'Si vous n’êtes pas à l’origine de cette demande, ignorez cet email : aucun article ne vous sera envoyé.',
  }),
  en: (expireLe) => ({
    sujet: 'Confirm your Asili Design newsletter subscription',
    titre: safeHtml`Confirm your subscription`,
    paragraphes: [
      'You asked to receive every article published on asilidesign.fr by email.',
      `This link is valid until ${dateDuLien('en', expireLe)}.`,
    ],
    bouton: 'Confirm my subscription',
    pied: 'If you did not make this request, ignore this email: no article will be sent to you.',
  }),
};

const DEJA_ABONNE: Readonly<Record<SupportedLocale, Redaction>> = {
  fr: {
    sujet: 'Vous êtes déjà abonné à la newsletter Asili Design',
    titre: safeHtml`Vous êtes déjà abonné`,
    paragraphes: [
      'Votre adresse reçoit déjà chaque article publié sur asilidesign.fr, en français.',
    ],
    bouton: 'Me désabonner',
    pied: 'Pour continuer à recevoir les articles, vous n’avez rien à faire.',
  },
  en: {
    sujet: 'You are already subscribed to the Asili Design newsletter',
    titre: safeHtml`You are already subscribed`,
    paragraphes: [
      'Your address already receives every article published on asilidesign.fr, in English.',
    ],
    bouton: 'Unsubscribe',
    pied: 'To keep receiving articles, there is nothing to do.',
  },
};

function lienDeLaPage(
  locale: SupportedLocale,
  page: 'confirm' | 'unsubscribe',
  jeton: string,
): string {
  return lienAvecJeton(pageDuSite(locale, `newsletter/${page}`), jeton);
}

@Injectable()
export class NewsletterMailerService
  extends ExpediteurSmtp
  implements INewsletterMailer
{
  constructor() {
    super(NewsletterMailerService.name, 'Newsletter mailer');
  }

  envoyerLaConfirmation(confirmation: ConfirmationAEnvoyer): Promise<void> {
    return this.rediger(
      confirmation.email,
      CONFIRMATION[confirmation.locale](confirmation.expireLe),
      lienDeLaPage(confirmation.locale, 'confirm', confirmation.jeton),
    );
  }

  envoyerDejaAbonne(rappel: RappelDAbonnement): Promise<void> {
    return this.rediger(
      rappel.email,
      DEJA_ABONNE[rappel.locale],
      lienDeLaPage(rappel.locale, 'unsubscribe', rappel.jetonDeDesabonnement),
    );
  }

  private rediger(
    email: string,
    { sujet, ...corps }: Redaction,
    lien: string,
  ): Promise<void> {
    return this.envoyer({
      to: email,
      subject: sujet,
      ...corpsAvecBouton({ ...corps, lien }),
    });
  }
}
