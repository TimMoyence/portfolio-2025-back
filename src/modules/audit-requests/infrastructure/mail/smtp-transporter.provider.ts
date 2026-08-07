import { Logger, Provider } from '@nestjs/common';
import { Transporter } from 'nodemailer';
import { createOptionalSmtpTransporter } from '../../../../common/infrastructure/mail/smtp-transporter.util';

export const SMTP_TRANSPORTER = Symbol('SMTP_TRANSPORTER');

export type SmtpTransporter = Transporter | null;

export const SmtpTransporterProvider: Provider = {
  provide: SMTP_TRANSPORTER,
  useFactory: (): SmtpTransporter => {
    const logger = new Logger('SmtpTransporterProvider');
    return createOptionalSmtpTransporter(logger, 'Audit request mailer');
  },
};
