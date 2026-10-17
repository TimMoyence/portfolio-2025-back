import { Logger } from '@nestjs/common';
import { createPrivateKey } from 'node:crypto';
import { createTransport, type Transporter } from 'nodemailer';
import {
  envBool,
  envBrut,
  envPort,
  envString,
} from '../../../config/env-readers.util';
import { messageDErreur } from '../../domain/errors/message-d-erreur';

export function createOptionalSmtpTransporter(
  logger: Logger,
  context: string,
): Transporter | null {
  const host = envString('SMTP_HOST');
  const port = envPort(['SMTP_PORT'], 'SMTP');
  const user = envBrut('SMTP_USER');
  const pass = envBrut('SMTP_PASS');

  if (!host || !port || !user || !pass) {
    logger.warn(
      `${context} disabled: SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS not fully configured`,
    );
    return null;
  }

  const secure = envBool('SMTP_SECURE', false) || port === 465;

  return createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ...buildDkimOptions(logger, context),
  }) as Transporter;
}

function buildDkimOptions(
  logger: Logger,
  context: string,
): Record<string, unknown> {
  const domainName = envString('SMTP_DKIM_DOMAIN');
  const keySelector = envString('SMTP_DKIM_SELECTOR');
  const rawPrivateKey = envBrut('SMTP_DKIM_PRIVATE_KEY');

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
      `${context}: DKIM signing disabled, SMTP_DKIM_PRIVATE_KEY is not a usable private key: ${messageDErreur(error)}`,
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

  return { dkim: { domainName, keySelector, privateKey } };
}

const DKIM_DOMAIN_REGEX =
  /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const DKIM_SELECTOR_REGEX = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/i;
