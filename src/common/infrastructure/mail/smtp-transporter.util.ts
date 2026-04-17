import { Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

/**
 * Construit un transporter nodemailer partage entre tous les mailers modules.
 *
 * Lit `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` depuis `process.env`
 * (optionnellement `SMTP_SECURE` pour forcer TLS). Retourne `null` si la
 * configuration est incomplete : les mailers appelants deviennent alors no-op
 * et doivent verifier la presence du transporter avant tout envoi.
 *
 * Remplace la duplication historique de `createTransport` dans 5 mailers
 * (audit-requests, contacts, users password-reset, users verification, budget,
 * lead-magnets) qui presentait 2 variantes incompatibles du `secure` flag.
 *
 * @param logger - logger Nest pour signaler le mode degrade
 * @param context - nom du mailer appelant (loggue dans le warning)
 * @returns un transporter configure ou null si la config est incomplete
 */
export function createOptionalSmtpTransporter(
  logger: Logger,
  context: string,
): Transporter | null {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const port = portRaw ? Number(portRaw) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    logger.warn(
      `${context} disabled: SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS not fully configured`,
    );
    return null;
  }

  // `SMTP_SECURE=true` force TLS implicit, sinon auto-detect selon le port
  // standard (465 = secure, autres = opportunistic STARTTLS).
  const secure = process.env.SMTP_SECURE === 'true' ? true : port === 465;

  return createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  }) as Transporter;
}
