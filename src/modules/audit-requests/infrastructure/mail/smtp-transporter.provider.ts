import { Logger, Provider } from '@nestjs/common';
import { Transporter } from 'nodemailer';
import { createOptionalSmtpTransporter } from '../../../../common/infrastructure/mail/smtp-transporter.util';

/**
 * Token d'injection Nest pour le transporter SMTP partage par les mailers
 * audit-requests. La valeur resolue est soit un {@link Transporter} nodemailer
 * configure, soit `null` lorsque les variables d'environnement SMTP sont
 * incompletes (mode degrade : les mailers deviennent no-op).
 */
export const SMTP_TRANSPORTER = Symbol('SMTP_TRANSPORTER');

/**
 * Type resolu derriere le token {@link SMTP_TRANSPORTER}. `null` signifie que
 * la configuration SMTP est incomplete et que l'envoi de mail est desactive.
 */
export type SmtpTransporter = Transporter | null;

/**
 * Provider Nest qui instancie un transporter nodemailer partage a partir des
 * variables d'environnement `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` /
 * `SMTP_PASS`. Si l'une est manquante, retourne `null` et log un warn pour
 * signaler que le mailer audit-requests est desactive.
 *
 * Usage : chaque mailer (notification, client report, expert report) injecte
 * `@Inject(SMTP_TRANSPORTER) private readonly transporter: SmtpTransporter`.
 */
export const SmtpTransporterProvider: Provider = {
  provide: SMTP_TRANSPORTER,
  useFactory: (): SmtpTransporter => {
    const logger = new Logger('SmtpTransporterProvider');
    return createOptionalSmtpTransporter(logger, 'Audit request mailer');
  },
};
