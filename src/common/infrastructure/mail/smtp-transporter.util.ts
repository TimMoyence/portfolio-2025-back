import { Logger } from '@nestjs/common';
import { createPrivateKey } from 'node:crypto';
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
    ...buildDkimOptions(logger, context),
  }) as Transporter;
}

/**
 * En-tetes couverts par la signature DKIM (tag `h=`).
 *
 * La RFC 8058 §4 impose que `List-Unsubscribe` et `List-Unsubscribe-Post`
 * soient signes : sans cela, Gmail ignore le bouton natif de
 * desabonnement, et l'en-tete que l'API prend la peine d'emettre reste
 * sans effet. Les autres champs sont ceux que nodemailer signe par
 * defaut, repris explicitement pour que la liste soit lisible ici.
 */
const DKIM_SIGNED_HEADERS = [
  // Liste par defaut de nodemailer (RFC 4871 §5.5), reprise integralement :
  // la restreindre laisserait un relais intermediaire ajouter un `Cc` ou
  // alterer `Content-Transfer-Encoding` sans invalider la signature.
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
  // Seul ajout au defaut : absent de la RFC 4871, exige par la RFC 8058.
  'List-Unsubscribe-Post',
].join(':');

/**
 * Construit l'option `dkim` de nodemailer si les trois variables
 * `SMTP_DKIM_DOMAIN`, `SMTP_DKIM_SELECTOR` et `SMTP_DKIM_PRIVATE_KEY`
 * sont renseignees.
 *
 * Signer cote applicatif rend la conformite RFC 8058 verifiable depuis
 * ce depot, au lieu de dependre d'un relais SMTP dont la configuration
 * n'est pas versionnee ici. En l'absence de cle, on ne signe pas et la
 * responsabilite reste au relais — comportement inchange.
 *
 * Une configuration partielle ne peut produire aucune signature valide :
 * elle est ignoree et signalee, plutot que de faire echouer les envois.
 */
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

  // Un `env_file` Docker ne supporte pas les valeurs multilignes : une
  // cle PEM y est fatalement collee avec des `\n` litteraux. On les
  // retablit plutot que de laisser la signature echouer.
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

  // Sans ce controle, une cle inexploitable ne produit AUCUNE erreur :
  // nodemailer avale l'exception (`lib/dkim/sign.js`, retour `false`) et
  // le message part simplement sans en-tete `DKIM-Signature`. Le
  // deploiement se croirait conforme RFC 8058 alors que les en-tetes
  // `List-Unsubscribe` ne seraient pas couverts — sans rien pour le
  // signaler.
  try {
    const key = createPrivateKey(privateKey);
    // Le type compte autant que la validite : nodemailer signe via
    // `crypto.createSign('rsa-sha256')`, et la RFC 6376 ne definit que
    // `rsa-sha256`. Une cle EC produirait une signature qu'aucun
    // verificateur DKIM n'accepte, une cle Ed25519 ferait lever
    // `createSign` — dans les deux cas l'exception est ravalee par
    // nodemailer et le message part sans en-tete, en silence.
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

  // Ces deux valeurs sont concatenees telles quelles dans l'en-tete
  // `DKIM-Signature` par nodemailer, sans echappement : un saut de ligne
  // y injecterait un en-tete arbitraire dans tous les messages.
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

/** Domaine DNS : etiquettes alphanumeriques separees par des points. */
const DKIM_DOMAIN_REGEX =
  /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

/** Selecteur DKIM : jeu de caracteres restreint, sans separateur d'en-tete. */
const DKIM_SELECTOR_REGEX = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/i;
