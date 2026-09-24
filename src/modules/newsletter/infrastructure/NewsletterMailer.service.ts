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
import type { INewsletterMailer } from '../domain/INewsletterMailer';
import type { NewsletterSubscriber } from '../domain/NewsletterSubscriber';

type Greeting = {
  readonly text: string;
  readonly html: EscapedHtml;
};

function trimSlashes(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && value[start] === '/') start += 1;
  while (end > start && value[end - 1] === '/') end -= 1;
  return value.slice(start, end);
}

@Injectable()
export class NewsletterMailerService implements INewsletterMailer {
  private readonly logger = new Logger(NewsletterMailerService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string | undefined;
  private readonly replyTo: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.get<string>('SMTP_FROM');
    this.replyTo =
      this.configService.get<string>('SMTP_REPLY_TO') ??
      'contact@asilidesign.fr';
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ??
      'https://asilidesign.fr';
    this.transporter = createOptionalSmtpTransporter(
      this.logger,
      'Newsletter mailer',
    );
  }

  async sendConfirmation(subscriber: NewsletterSubscriber): Promise<void> {
    const confirmUrl = this.buildApiUrl('/newsletter/confirm', {
      token: subscriber.confirmToken,
    });
    const unsubscribeUrl = this.lienDeDesabonnement(subscriber);
    const greeting = this.buildGreeting(subscriber.firstName);

    await this.envoyer(subscriber, {
      // `List-Unsubscribe` (RFC 8058) ne couvre que les envois de liste :
      // un retrait en un clic depuis ce message transactionnel laisserait
      // l'abonne bloque en `pending`.
      subject: 'Confirmez votre inscription a la newsletter asilidesign.fr',
      text: `${greeting.text},

Merci de vous etre inscrit. Cliquez sur ce lien pour confirmer votre email :
${confirmUrl}

Vous recevrez des emails pratiques lies a la formation "${subscriber.sourceFormationSlug}" (outils testes, cas d'usage, retours d'XP). Zero teasing, zero pitch cache : chaque email livre l'integralite du contenu promis dans son sujet.

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
    const unsubscribeUrl = this.lienDeDesabonnement(subscriber);
    const greeting = this.buildGreeting(subscriber.firstName);

    await this.envoyer(subscriber, {
      headers: this.buildListUnsubscribeHeaders(unsubscribeUrl),
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

  private lienDeDesabonnement(subscriber: NewsletterSubscriber): string {
    return this.buildApiUrl('/newsletter/unsubscribe', {
      token: subscriber.unsubscribeToken,
    });
  }

  /**
   * En-tetes de desabonnement RFC 8058, exiges par Gmail des expediteurs
   * en nombre depuis 2024. Leur absence degrade la delivrabilite.
   *
   * `List-Unsubscribe-Post` engage l'API a traiter un POST non
   * authentifie sur l'URL fournie : l'endpoint
   * `POST /newsletter/unsubscribe` existe pour cela. Annoncer l'en-tete
   * sans cet endpoint ferait echouer le bouton natif du client mail.
   *
   * L'adresse mailto reprend le reply-to du mailer, garantissant une
   * boite reellement relevee ; le sujet permet le tri automatique. Elle
   * est reduite a l'adresse nue : un `SMTP_REPLY_TO` de la forme
   * `Nom <adresse>` produirait un `mailto:` malforme.
   *
   * Ces en-tetes ne sont poses que sur les envois en nombre. La RFC 8058
   * §4 impose en outre qu'ils soient couverts par la signature DKIM
   * (tag `h=`) : la signature etant assuree par le relais SMTP et non
   * par nodemailer ici, ce point reste a verifier cote relais.
   */
  private buildListUnsubscribeHeaders(
    unsubscribeUrl: string,
  ): Record<string, string> {
    return {
      'List-Unsubscribe': `<mailto:${this.bareReplyToAddress()}?subject=unsubscribe>, <${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
  }

  private bareReplyToAddress(): string {
    const open = this.replyTo.indexOf('<');
    const close = this.replyTo.indexOf('>', open + 1);
    if (open < 0 || close < 0) return this.replyTo.trim();
    return this.replyTo.slice(open + 1, close).trim();
  }

  private buildGreeting(firstName: string | null): Greeting {
    if (!firstName || firstName.trim().length === 0) {
      return { text: 'Bonjour', html: safeHtml`Bonjour` };
    }
    return {
      text: `Bonjour ${firstName}`,
      html: safeHtml`Bonjour ${this.escapeHtml(firstName)}`,
    };
  }

  private buildApiUrl(apiPath: string, params: Record<string, string>): string {
    const apiPrefix = trimSlashes(
      this.configService.get<string>('API_PREFIX') ?? 'api/v1/portfolio25',
    );
    // Un prefixe vide produirait `//newsletter/...`, que `new URL()`
    // interprete comme une URL protocol-relative : le premier segment
    // deviendrait l'hote (`https://newsletter/...`). On normalise donc
    // les slashes doublons plutot que de dependre de la forme du prefixe.
    const url = new URL(
      `/${apiPrefix}${apiPath}`.replace(/\/{2,}/g, '/'),
      this.frontendUrl,
    );
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private buildConfirmationHtml(options: {
    greeting: EscapedHtml;
    confirmUrl: string;
    unsubscribeUrl: string;
    sourceFormationSlug: string;
  }): EscapedHtml {
    return safeHtml`<div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 24px;"><div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;"><h2 style="margin-top: 0; color: #4fb3a2;">Confirmez votre inscription</h2><p>${options.greeting},</p><p>Merci de vous etre inscrit. Confirmez votre email en cliquant ci-dessous :</p><p style="margin: 20px 0;"><a href="${escapeUrl(options.confirmUrl)}" style="display: inline-block; padding: 12px 24px; background-color: #4fb3a2; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirmer mon email</a></p><p style="font-size: 13px; color: #555;">Vous recevrez des emails pratiques lies a la formation <strong>${this.escapeHtml(options.sourceFormationSlug)}</strong>. Zero teasing, chaque email livre sa valeur integralement.</p><hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" /><p style="font-size: 12px; color: #666;">Desabonnement instantane : <a href="${escapeUrl(options.unsubscribeUrl)}" style="color: #4fb3a2;">retirer mon consentement</a></p></div></div>`;
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

  private escapeHtml(input: string): EscapedHtml {
    return escapeHtml(input);
  }
}
