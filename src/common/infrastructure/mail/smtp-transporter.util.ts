import { Logger } from '@nestjs/common';
import { createPrivateKey } from 'node:crypto';
import { createTransport, type Transporter } from 'nodemailer';

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

  const secure = process.env.SMTP_SECURE === 'true' ? true : port === 465;

  return createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ...buildDkimOptions(logger, context),
  }) as Transporter;
}

const DKIM_SIGNED_HEADERS = [
  'From',
  'Sender',
  'Reply-To',
  'Subject',
  'Date',
  'Message-ID',
  'To',
  'Cc',
  'MIME-Version',
  'Content-Type',
  'Content-Transfer-Encoding',
  'Content-ID',
  'Content-Description',
  'Resent-Date',
  'Resent-From',
  'Resent-Sender',
  'Resent-To',
  'Resent-Cc',
  'Resent-Message-ID',
  'In-Reply-To',
  'References',
  'List-Id',
  'List-Help',
  'List-Unsubscribe',
  'List-Subscribe',
  'List-Post',
  'List-Owner',
  'List-Archive',
  'List-Unsubscribe-Post',
].join(':');

function buildDkimOptions(
  logger: Logger,
  context: string,
): Record<string, unknown> {
  const domainName = process.env.SMTP_DKIM_DOMAIN;
  const keySelector = process.env.SMTP_DKIM_SELECTOR;
  const rawPrivateKey = process.env.SMTP_DKIM_PRIVATE_KEY;

  if (!domainName && !keySelector && !rawPrivateKey) return {};

  if (!domainName || !keySelector || !rawPrivateKey) {
    logger.error(
      `${context}: DKIM signing disabled, SMTP_DKIM_DOMAIN/SMTP_DKIM_SELECTOR/SMTP_DKIM_PRIVATE_KEY must all be set`,
    );
    return {};
  }

  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

  try {
    const key = createPrivateKey(privateKey);
    if (key.asymmetricKeyType !== 'rsa') {
      logger.error(
        `${context}: DKIM signing disabled, SMTP_DKIM_PRIVATE_KEY must be an RSA key (got ${key.asymmetricKeyType ?? 'unknown'})`,
      );
      return {};
    }
  } catch (error) {
    logger.error(
      `${context}: DKIM signing disabled, SMTP_DKIM_PRIVATE_KEY is not a usable private key`,
      error instanceof Error ? error.message : String(error),
    );
    return {};
  }

  if (!DKIM_DOMAIN_REGEX.test(domainName)) {
    logger.error(
      `${context}: DKIM signing disabled, SMTP_DKIM_DOMAIN is not a valid domain`,
    );
    return {};
  }
  if (!DKIM_SELECTOR_REGEX.test(keySelector)) {
    logger.error(
      `${context}: DKIM signing disabled, SMTP_DKIM_SELECTOR is not a valid selector`,
    );
    return {};
  }

  return {
    dkim: {
      domainName,
      keySelector,
      privateKey,
      headerFieldNames: DKIM_SIGNED_HEADERS,
    },
  };
}

const DKIM_DOMAIN_REGEX =
  /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const DKIM_SELECTOR_REGEX = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/i;
