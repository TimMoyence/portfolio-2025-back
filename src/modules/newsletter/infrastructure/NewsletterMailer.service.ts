import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SendMailOptions, Transporter } from 'nodemailer';
import { createOptionalSmtpTransporter } from '../../../common/infrastructure/mail/smtp-transporter.util';
import {
  escapeHtml,
  escapeUrl,
  safeHtml,
} from '../../../common/infrastructure/mail/html-escape.util';
import type { EscapedHtml } from '../../../common/infrastructure/mail/html-escape.util';
import { entetesDeDesabonnement } from '../../../common/infrastructure/mail/entetes-de-desabonnement';
import { lienAvecJeton } from '../../../common/domain/lien-avec-jeton';
import {
  adresseDeReponse,
  expediteurDesCourriels,
} from '../../../config/adresses-de-courriel';
import type { SourceDEnv } from '../../../config/env-readers.util';
import {
  lienDeDesabonnement,
  urlPubliqueDeLApi,
} from '../../../config/urls-publiques';
import type { INewsletterMailer } from '../domain/INewsletterMailer';
import type { NewsletterSubscriber } from '../domain/NewsletterSubscriber';
import { DAILY_BRIEF_SOURCE } from '../domain/SupportedFormationSlugs';

type Greeting = {
  readonly text: string;
  readonly html: EscapedHtml;
};

@Injectable()
export class NewsletterMailerService implements INewsletterMailer {
  private readonly logger = new Logger(NewsletterMailerService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string | undefined;
  private readonly replyTo: string;

  constructor(private readonly configService: ConfigService) {
    this.from = expediteurDesCourriels(this.environnement());
    this.replyTo = adresseDeReponse(this.environnement());
    this.transporter = createOptionalSmtpTransporter(
      this.logger,
      'Newsletter mailer',
    );
  }

  async sendConfirmation(subscriber: NewsletterSubscriber): Promise<void> {
    const confirmUrl = lienAvecJeton(
      urlPubliqueDeLApi('newsletter/confirm', this.environnement()),
      subscriber.confirmToken,
    );
    const unsubscribeUrl = this.lienDeDesabonnementDe(subscriber);
    const greeting = this.buildGreeting(subscriber.firstName);

    await this.envoyer(subscriber, {
      // `List-Unsubscribe` (RFC 8058) ne couvre que les envois de liste :
      // un retrait en un clic depuis ce message transactionnel laisserait
      // l'abonne bloque en `pending`.
      subject: 'Confirmez votre inscription a la newsletter asilidesign.fr',
      text: `${greeting.text},

Merci de vous etre inscrit. Cliquez sur ce lien pour confirmer votre email :
${confirmUrl}

${
  subscriber.sourceFormationSlug === DAILY_BRIEF_SOURCE
    ? `Vous recevrez la veille IA quotidienne : une edition sourcee chaque matin de semaine, faits verifiables et liens vers les sources.`
    : `Vous recevrez des emails pratiques lies a la formation "${subscriber.sourceFormationSlug}" (outils testes, cas d'usage, retours d'XP). Zero teasing, zero pitch cache : chaque email livre l'integralite du contenu promis dans son sujet.`
}

Vous pouvez retirer votre consentement a tout moment :
${unsubscribeUrl}

Tim — asilidesign.fr`,
      html: this.buildConfirmationHtml({
        greeting: greeting.html,
        confirmUrl,
        unsubscribeUrl,
        sourceFormationSlug: subscriber.sourceFormationSlug,
      }),
    });
  }

  async sendWelcome(subscriber: NewsletterSubscriber): Promise<void> {
    const unsubscribeUrl = this.lienDeDesabonnementDe(subscriber);
    const headers = entetesDeDesabonnement(this.replyTo, unsubscribeUrl);
    const greeting = this.buildGreeting(subscriber.firstName);

    if (subscriber.sourceFormationSlug === DAILY_BRIEF_SOURCE) {
      await this.envoyer(subscriber, {
        headers,
        subject: 'Bienvenue dans la veille IA',
        text: `${greeting.text},

Votre inscription est confirmee. La veille IA arrive chaque matin de semaine : l'essentiel du jour, des faits sources et les liens pour verifier par vous-meme.

Desabonnement instantane : ${unsubscribeUrl}

Tim`,
        html: safeHtml`<div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 24px;"><div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;"><h2 style="margin-top: 0; color: #4fb3a2;">Bienvenue dans la veille IA</h2><p>${greeting.html},</p><p>Votre inscription est confirmee. La veille IA arrive chaque matin de semaine : l'essentiel du jour, des faits sources et les liens pour verifier par vous-meme.</p><hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" /><p style="font-size: 12px; color: #666;">Desabonnement instantane : <a href="${escapeUrl(unsubscribeUrl)}" style="color: #4fb3a2;">retirer mon consentement</a></p></div></div>`,
      });
      return;
    }

    await this.envoyer(subscriber, {
      headers,
      subject: 'Bienvenue — ce qui arrive dans votre boite mail',
      text: `${greeting.text},

Votre inscription est confirmee. Voici ce qui va arriver dans les 10 prochains jours :
- J0 : votre ressource principale (lien direct)
- J+2 : un prompt complet a copier
- J+5 : mon stack detaille, gratuit
- J+8 : ce qui ne marche PAS (retour honnete)
- J+10 : on continue ensemble, ou on s'arrete — vous choisissez

Les sequences drip detaillees sont en cours de deploiement (S1.5). Si vous recevez cet email mais pas les suivants sous 48h, repondez moi : je regarde.

Desabonnement instantane : ${unsubscribeUrl}

Tim`,
      html: this.buildWelcomeHtml({ greeting: greeting.html, unsubscribeUrl }),
    });
  }

  async sendUnsubscribeAck(subscriber: NewsletterSubscriber): Promise<void> {
    const greeting = this.buildGreeting(subscriber.firstName);
    await this.envoyer(subscriber, {
      subject: 'Desabonnement confirme',
      text: `${greeting.text},

Votre desabonnement est effectif. Vous ne recevrez plus d'email de newsletter de ma part.

Si c'etait une erreur, repondez simplement a cet email.

Tim`,
      html: this.buildUnsubscribeAckHtml({ greeting: greeting.html }),
    });
  }

  private async envoyer(
    subscriber: NewsletterSubscriber,
    message: Omit<SendMailOptions, 'from' | 'to' | 'replyTo'>,
  ): Promise<void> {
    if (!this.transporter) return;
    await this.transporter.sendMail({
      from: this.from,
      to: subscriber.email,
      replyTo: this.replyTo,
      ...message,
    });
  }

  private environnement(): SourceDEnv {
    return {
      FRONTEND_URL: this.configService.get<string>('FRONTEND_URL'),
      API_PREFIX: this.configService.get<string>('API_PREFIX'),
      SMTP_FROM: this.configService.get<string>('SMTP_FROM'),
      SMTP_REPLY_TO: this.configService.get<string>('SMTP_REPLY_TO'),
    };
  }

  private lienDeDesabonnementDe(subscriber: NewsletterSubscriber): string {
    return lienDeDesabonnement(
      subscriber.unsubscribeToken,
      this.environnement(),
    );
  }

  private buildGreeting(firstName: string | null): Greeting {
    if (!firstName || firstName.trim().length === 0) {
      return { text: 'Bonjour', html: safeHtml`Bonjour` };
    }
    return {
      text: `Bonjour ${firstName}`,
      html: safeHtml`Bonjour ${escapeHtml(firstName)}`,
    };
  }

  private buildConfirmationHtml(options: {
    greeting: EscapedHtml;
    confirmUrl: string;
    unsubscribeUrl: string;
    sourceFormationSlug: string;
  }): EscapedHtml {
    const promise =
      options.sourceFormationSlug === DAILY_BRIEF_SOURCE
        ? safeHtml`Vous recevrez la <strong>veille IA quotidienne</strong> : une edition sourcee chaque matin de semaine.`
        : safeHtml`Vous recevrez des emails pratiques lies a la formation <strong>${escapeHtml(options.sourceFormationSlug)}</strong>. Zero teasing, chaque email livre sa valeur integralement.`;
    return safeHtml`<div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 24px;"><div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;"><h2 style="margin-top: 0; color: #4fb3a2;">Confirmez votre inscription</h2><p>${options.greeting},</p><p>Merci de vous etre inscrit. Confirmez votre email en cliquant ci-dessous :</p><p style="margin: 20px 0;"><a href="${escapeUrl(options.confirmUrl)}" style="display: inline-block; padding: 12px 24px; background-color: #4fb3a2; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirmer mon email</a></p><p style="font-size: 13px; color: #555;">${promise}</p><hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" /><p style="font-size: 12px; color: #666;">Desabonnement instantane : <a href="${escapeUrl(options.unsubscribeUrl)}" style="color: #4fb3a2;">retirer mon consentement</a></p></div></div>`;
  }

  private buildWelcomeHtml(options: {
    greeting: EscapedHtml;
    unsubscribeUrl: string;
  }): EscapedHtml {
    return safeHtml`<div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 24px;"><div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;"><h2 style="margin-top: 0; color: #4fb3a2;">Bienvenue</h2><p>${options.greeting},</p><p>Votre inscription est confirmee. Voici ce qui arrive dans les 10 prochains jours :</p><ul><li><strong>J+2</strong> : un prompt complet a copier</li><li><strong>J+5</strong> : mon stack IA detaille, gratuit</li><li><strong>J+8</strong> : ce qui ne marche PAS (retour honnete)</li><li><strong>J+10</strong> : vous choisissez de continuer ou d'arreter</li></ul><p>Si vous recevez cet email mais pas les suivants sous 48h, repondez a ce message — je regarde.</p><hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" /><p style="font-size: 12px; color: #666;">Desabonnement instantane : <a href="${escapeUrl(options.unsubscribeUrl)}" style="color: #4fb3a2;">retirer mon consentement</a></p></div></div>`;
  }

  private buildUnsubscribeAckHtml(options: {
    greeting: EscapedHtml;
  }): EscapedHtml {
    return safeHtml`<div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 24px;"><div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;"><h2 style="margin-top: 0; color: #4fb3a2;">Desabonnement confirme</h2><p>${options.greeting},</p><p>Votre desabonnement est effectif. Vous ne recevrez plus d'email de ma part.</p><p>Si c'etait une erreur, repondez simplement a cet email.</p></div></div>`;
  }
}
