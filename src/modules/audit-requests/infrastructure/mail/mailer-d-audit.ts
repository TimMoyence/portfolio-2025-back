import { Inject } from '@nestjs/common';
import type { SendMailOptions } from 'nodemailer';
import { expediteurDesCourriels } from '../../../../config/adresses-de-courriel';
import { SMTP_TRANSPORTER } from './smtp-transporter.provider';
import type { SmtpTransporter } from './smtp-transporter.provider';

export abstract class MailerDAudit {
  constructor(
    @Inject(SMTP_TRANSPORTER)
    private readonly transporter: SmtpTransporter,
  ) {}

  protected async envoyer(
    message: Omit<SendMailOptions, 'from'>,
  ): Promise<void> {
    if (!this.transporter) return;
    await this.transporter.sendMail({
      from: expediteurDesCourriels(),
      ...message,
    });
  }
}
