import { randomUUID } from 'crypto';
import type { IncomingMessage } from 'http';
import type { Options } from 'pino-http';

const EN_TETES_SECRETS = [
  'req.headers.authorization',
  'req.headers["x-participant-token"]',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];

function estSondeDeSante(req: IncomingMessage): boolean {
  return req.url?.includes('/health') ?? false;
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
    redact: { paths: EN_TETES_SECRETS, censor: '[REDACTED]' },
    autoLogging: { ignore: estSondeDeSante },
    quietReqLogger: true,
    genReqId: (req) => (req.headers['x-request-id'] as string) ?? randomUUID(),
    customProps: (req) => ({
      correlationId: req.id,
    }),
    ...(environnement === 'test' ? { level: 'silent' } : {}),
  };
}
