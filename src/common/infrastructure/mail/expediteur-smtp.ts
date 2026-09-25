import { Logger } from '@nestjs/common';
import type { Transporter } from 'nodemailer';
import { escapeHtml, type EscapedHtml } from './html-escape.util';
import { createOptionalSmtpTransporter } from './smtp-transporter.util';

export abstract class ExpediteurSmtp {
  protected readonly logger: Logger;
  protected readonly transporter: Transporter | null;
  protected readonly from = process.env.SMTP_FROM;

  protected constructor(nom: string, contexte: string) {
    this.logger = new Logger(nom);
    this.transporter = createOptionalSmtpTransporter(this.logger, contexte);
  }

  protected escapeHtml(input: string): EscapedHtml {
    return escapeHtml(input);
  }
}
