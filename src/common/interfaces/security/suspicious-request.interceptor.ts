import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { resolveClientIpOrUnknown } from './client-ip.util';
import type { ISecurityEventsStore } from './ISecurityEventsStore';
import { SECURITY_EVENTS_STORE } from './ISecurityEventsStore';
import type { SecurityConfig } from './security.config';
import { SECURITY_CONFIG } from './security.tokens';
import { scoreRequest } from './suspicious-request-scorer';

const LOOPBACK_IPV4 = '127.0.0.1';
const LOOPBACK_IPS = new Set([LOOPBACK_IPV4, `::ffff:${LOOPBACK_IPV4}`, '::1']);

@Injectable()
export class SuspiciousRequestInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SuspiciousRequest');

  constructor(
    @Inject(SECURITY_CONFIG) private readonly config: SecurityConfig,
    @Inject(SECURITY_EVENTS_STORE)
    private readonly store: ISecurityEventsStore,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();

    // Requetes loopback = trafic interne (Docker health checks, sondes).
    // On lit l'adresse brute du socket EN PREMIER, jamais `req.ip` :
    // depuis l'activation de `trust proxy` (src/main.ts), `req.ip` est
    // derive de `X-Forwarded-For`. Un client pourrait donc annoncer
    // `X-Forwarded-For: 127.0.0.1` et court-circuiter tout le scoring de
    // suspicion. Les health checks Docker ne passent de toute facon pas
    // par le reverse-proxy : leur adresse de socket est deja loopback.
    const socketIp = req.socket?.remoteAddress ?? req.ip ?? '';
    if (LOOPBACK_IPS.has(socketIp)) {
      return next.handle();
    }

    const res = httpCtx.getResponse<Response>();
    const startNs = process.hrtime.bigint();

    const evaluateAndLog = (aborted: boolean): void => {
      try {
        const responseTimeMs = Number(process.hrtime.bigint() - startNs) / 1e6;
        const ip = this.resolveIp(req);
        const userAgent = this.headerString(req, 'user-agent');
        const acceptLanguage = this.headerString(req, 'accept-language');
        const referer = this.headerString(req, 'referer');

        const { score, reasons } = scoreRequest({
          method: req.method,
          path: req.originalUrl || req.url,
          statusCode: res.statusCode,
          userAgent,
          acceptLanguage,
          referer,
          responseTimeMs,
          aborted,
          rateLimitHit: res.statusCode === 429,
        });

        if (score < this.config.suspiciousScoreThreshold) {
          return;
        }

        const occurredAtMs = Date.now();
        const path = req.originalUrl || req.url;

        void this.store
          .recordEvent({
            ip,
            userAgent,
            method: req.method,
            path,
            statusCode: res.statusCode,
            score,
            reasons,
            occurredAtMs,
          })
          .catch((err: unknown) => {
            this.logger.warn(
              `[SECURITY] store.recordEvent a echoue: ${String(err)}`,
            );
          });

        this.logger.warn(
          `[SECURITY] suspicious ip=${ip} method=${req.method} path=${path} status=${res.statusCode} score=${score} reasons=${reasons.join(',')} ua="${this.truncate(userAgent, 200)}" rtMs=${responseTimeMs.toFixed(1)} aborted=${aborted}`,
        );
      } catch (err) {
        this.logger.warn(
          `[SECURITY] evaluation a plante: ${String(err)}. Requete non marquee.`,
        );
      }
    };

    return next.handle().pipe(
      tap({
        next: () => evaluateAndLog(false),
        error: () => evaluateAndLog(false),
        complete: () => {
          if (req.destroyed || !res.writableEnded) {
            evaluateAndLog(true);
          }
        },
      }),
    );
  }

  private resolveIp(req: Request): string {
    return resolveClientIpOrUnknown(req);
  }

  private headerString(req: Request, name: string): string {
    const value = req.headers[name];
    if (Array.isArray(value)) return value.join(',');
    return value ?? '';
  }

  private truncate(value: string, max: number): string {
    if (value.length <= max) return value;
    return `${value.slice(0, max)}…`;
  }
}
