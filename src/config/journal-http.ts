import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import type { SerializedRequest } from 'pino';
import type { Options } from 'pino-http';
import {
  CENSURE,
  referentJournalisable,
  urlJournalisable,
} from '../common/interfaces/http/url-journalisable';
import { EN_TETE_JETON } from '../modules/formations/interfaces/ParticipantToken.service';

const EN_TETES_SECRETS = [
  'req.headers.authorization',
  `req.headers["${EN_TETE_JETON}"]`,
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];

const EN_TETE_DE_CORRELATION = 'x-request-id';
const IDENTIFIANT_RECEVABLE = /^[A-Za-z0-9._:-]{1,128}$/;

function identifiantDeCorrelation(
  req: IncomingMessage,
  res: ServerResponse,
): string {
  const recu = req.headers[EN_TETE_DE_CORRELATION];
  const identifiant =
    typeof recu === 'string' && IDENTIFIANT_RECEVABLE.test(recu)
      ? recu
      : randomUUID();
  res.setHeader(EN_TETE_DE_CORRELATION, identifiant);
  return identifiant;
}

function estSondeDeSante(req: IncomingMessage): boolean {
  return req.url?.includes('/health') ?? false;
}

function enTetesJournalisables(
  enTetes: SerializedRequest['headers'],
): SerializedRequest['headers'] {
  const { referer } = enTetes;
  return typeof referer === 'string'
    ? { ...enTetes, referer: referentJournalisable(referer) }
    : enTetes;
}

function requeteJournalisee(req: SerializedRequest): Record<string, unknown> {
  return {
    id: req.id,
    method: req.method,
    url: urlJournalisable(req.url, req.params),
    headers: enTetesJournalisables(req.headers),
    remoteAddress: req.remoteAddress,
    remotePort: req.remotePort,
  };
}

export function optionsJournalHttp(environnement: string | undefined): Options {
  return {
    transport:
      environnement !== 'production'
        ? {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
          }
        : undefined,
    redact: { paths: EN_TETES_SECRETS, censor: CENSURE },
    serializers: { req: requeteJournalisee },
    autoLogging: { ignore: estSondeDeSante },
    quietReqLogger: true,
    quietResLogger: true,
    customSuccessObject: (req, _res, valeur: Record<string, unknown>) => ({
      req,
      ...valeur,
    }),
    customErrorObject: (
      req,
      _res,
      _erreur,
      valeur: Record<string, unknown>,
    ) => ({ req, ...valeur }),
    genReqId: identifiantDeCorrelation,
    customProps: (req) => ({
      correlationId: req.id,
    }),
    ...(environnement === 'test' ? { level: 'silent' } : {}),
  };
}
