import { Injectable, Logger } from '@nestjs/common';
import type { Transporter } from 'nodemailer';
import { createOptionalSmtpTransporter } from '../../../common/infrastructure/mail/smtp-transporter.util';
import type { INewsletterMailer } from '../domain/INewsletterMailer';
import type { NewsletterSubscriber } from '../domain/NewsletterSubscriber';

/**
 * Impl initiale : emails inline plain text + HTML minimal sans
 * teasing. Les templates Handlebars localises `{locale}/drip-*.hbs`
 * arrivent en sprint S1.5 — leur absence ne doit pas bloquer le flow
 * de double opt-in ni le respect de la regle "zero bullshit email".
 *
 * Chaque message livre integralement la valeur qu'il promet :
 *  - confirmation : lien de confirmation + lien de desabonnement,
 *  - welcome : lien direct vers la ressource promise + rappel valeur,
 *  - unsubscribeAck : confirmation du desabonnement, sans pitch.
 */
@Injectable()
export class NewsletterMailerService implements INewsletterMailer {
  private readonly logger = new Logger(NewsletterMailerService.name);
  private readonly transporter: Transporter | null;
  private readonly from = process.env.SMTP_FROM;
  private readonly replyTo =
    process.env.SMTP_REPLY_TO ?? 'tim.moyence@gmail.com';
  private readonly frontendUrl =
    process.env.FRONTEND_URL ?? 'https://asilidesign.fr';

  constructor() {
    this.transporter = createOptionalSmtpTransporter(
      this.logger,
      'Newsletter mailer',
    );
  }

  async sendConfirmation(subscriber: NewsletterSubscriber): Promise<void> {
    if (!this.transporter) return;
    const confirmUrl = this.buildUrl('/newsletter/confirm', {
      token: subscriber.confirmToken,
    });
    const unsubscribeUrl = this.buildUrl('/newsletter/unsubscribe', {
      token: subscriber.unsubscribeToken,
    });
    const greeting = this.buildGreeting(subscriber.firstName);

    await this.transporter.sendMail({
      from: this.from,
      to: subscriber.email,
      replyTo: this.replyTo,
      subject: 'Confirmez votre inscription a la newsletter asilidesign.fr',
      text: `${greeting},

Merci de vous etre inscrit. Cliquez sur ce lien pour confirmer votre email :
${confirmUrl}

Vous recevrez des emails pratiques lies a la formation "${subscriber.sourceFormationSlug}" (outils testes, cas d'usage, retours d'XP). Zero teasing, zero pitch cache : chaque email livre l'integralite du contenu promis dans son sujet.

Vous pouvez retirer votre consentement a tout moment :
${unsubscribeUrl}

Tim — asilidesign.fr`,
      html: this.buildConfirmationHtml({
        greeting,
        confirmUrl,
        unsubscribeUrl,
        sourceFormationSlug: subscriber.sourceFormationSlug,
      }),
    });
  }

  async sendWelcome(subscriber: NewsletterSubscriber): Promise<void> {
    if (!this.transporter) return;
    const unsubscribeUrl = this.buildUrl('/newsletter/unsubscribe', {
      token: subscriber.unsubscribeToken,
    });
    const greeting = this.buildGreeting(subscriber.firstName);

    await this.transporter.sendMail({
      from: this.from,
      to: subscriber.email,
      replyTo: this.replyTo,
      subject: 'Bienvenue — ce qui arrive dans votre boite mail',
      text: `${greeting},

Votre inscription est confirmee. Voici ce qui va arriver dans les 10 prochains jours :
- J0 : votre ressource principale (lien direct)
- J+2 : un prompt complet a copier
- J+5 : mon stack detaille, gratuit
- J+8 : ce qui ne marche PAS (retour honnete)
- J+10 : on continue ensemble, ou on s'arrete — vous choisissez

Les sequences drip detaillees sont en cours de deploiement (S1.5). Si vous recevez cet email mais pas les suivants sous 48h, repondez moi : je regarde.

Desabonnement instantane : ${unsubscribeUrl}

Tim`,
      html: this.buildWelcomeHtml({ greeting, unsubscribeUrl }),
    });
  }

  async sendUnsubscribeAck(subscriber: NewsletterSubscriber): Promise<void> {
    if (!this.transporter) return;
    const greeting = this.buildGreeting(subscriber.firstName);
    await this.transporter.sendMail({
      from: this.from,
      to: subscriber.email,
      replyTo: this.replyTo,
      subject: 'Desabonnement confirme',
      text: `${greeting},

Votre desabonnement est effectif. Vous ne recevrez plus d'email de newsletter de ma part.

Si c'etait une erreur, repondez simplement a cet email.

Tim`,
      html: this.buildUnsubscribeAckHtml({ greeting }),
    });
  }

  private buildGreeting(firstName: string | null): string {
    return firstName && firstName.trim().length > 0
      ? `Bonjour ${this.escapeHtml(firstName)}`
      : 'Bonjour';
  }

  private buildUrl(path: string, params: Record<string, string>): string {
    const url = new URL(path, this.frontendUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private buildConfirmationHtml(options: {
    greeting: string;
    confirmUrl: string;
    unsubscribeUrl: string;
    sourceFormationSlug: string;
  }): string {
    return `<div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 24px;"><div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;"><h2 style="margin-top: 0; color: #4fb3a2;">Confirmez votre inscription</h2><p>${options.greeting},</p><p>Merci de vous etre inscrit. Confirmez votre email en cliquant ci-dessous :</p><p style="margin: 20px 0;"><a href="${options.confirmUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4fb3a2; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirmer mon email</a></p><p style="font-size: 13px; color: #555;">Vous recevrez des emails pratiques lies a la formation <strong>${this.escapeHtml(options.sourceFormationSlug)}</strong>. Zero teasing, chaque email livre sa valeur integralement.</p><hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" /><p style="font-size: 12px; color: #666;">Desabonnement instantane : <a href="${options.unsubscribeUrl}" style="color: #4fb3a2;">retirer mon consentement</a></p></div></div>`;
  }

  private buildWelcomeHtml(options: {
    greeting: string;
    unsubscribeUrl: string;
  }): string {
    return `<div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 24px;"><div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;"><h2 style="margin-top: 0; color: #4fb3a2;">Bienvenue</h2><p>${options.greeting},</p><p>Votre inscription est confirmee. Voici ce qui arrive dans les 10 prochains jours :</p><ul><li><strong>J+2</strong> : un prompt complet a copier</li><li><strong>J+5</strong> : mon stack IA detaille, gratuit</li><li><strong>J+8</strong> : ce qui ne marche PAS (retour honnete)</li><li><strong>J+10</strong> : vous choisissez de continuer ou d'arreter</li></ul><p>Si vous recevez cet email mais pas les suivants sous 48h, repondez a ce message — je regarde.</p><hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" /><p style="font-size: 12px; color: #666;">Desabonnement instantane : <a href="${options.unsubscribeUrl}" style="color: #4fb3a2;">retirer mon consentement</a></p></div></div>`;
  }

  private buildUnsubscribeAckHtml(options: { greeting: string }): string {
    return `<div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 24px;"><div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;"><h2 style="margin-top: 0; color: #4fb3a2;">Desabonnement confirme</h2><p>${options.greeting},</p><p>Votre desabonnement est effectif. Vous ne recevrez plus d'email de ma part.</p><p>Si c'etait une erreur, repondez simplement a cet email.</p></div></div>`;
  }

  /** Echappe les caracteres HTML speciaux pour prevenir les injections XSS. */
  private escapeHtml(input: string): string {
    return input
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
