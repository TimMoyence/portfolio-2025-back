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
import type { ISecurityEventsStore } from './ISecurityEventsStore';
import { SECURITY_EVENTS_STORE } from './ISecurityEventsStore';
import type { SecurityConfig } from './security.config';
import { SECURITY_CONFIG } from './security.tokens';
import { scoreRequest } from './suspicious-request-scorer';

/**
 * IPs loopback (Docker health checks, sondes internes).
 * Ces requetes ne transitent jamais par le reverse-proxy et ne
 * representent aucun risque — on les exclut du scoring pour eviter
 * le bruit dans les logs et le store d'evenements.
 */
const LOOPBACK_IPS = new Set(['127.0.0.1', '::ffff:127.0.0.1', '::1']);

/**
 * Intercepteur global qui analyse chaque requete HTTP completee,
 * calcule un score de suspicion et persiste les evenements au-dessus
 * du seuil dans le store d'evenements.
 *
 * L'intercepteur ne bloque jamais les requetes : son unique role est
 * la detection et la tracabilite. Le blocage reel des IPs malicieuses
 * se fait en amont (reverse-proxy / fail2ban) a partir des logs
 * structures produits ici.
 */
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
    // Pas besoin de scorer ni loguer.
    const ip = req.ip ?? req.socket?.remoteAddress ?? '';
    if (LOOPBACK_IPS.has(ip)) {
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

        // Log structure single-line — lisible par grep et redirigeable
        // vers un channel Loki/Grafana via le label [SECURITY].
        this.logger.warn(
          `[SECURITY] suspicious ip=${ip} method=${req.method} path=${path} status=${res.statusCode} score=${score} reasons=${reasons.join(',')} ua="${this.truncate(userAgent, 200)}" rtMs=${responseTimeMs.toFixed(1)} aborted=${aborted}`,
        );
      } catch (err) {
        // L'intercepteur ne doit JAMAIS casser la requete originale.
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

  /** Resout l'IP reelle derriere le reverse-proxy (X-Forwarded-For, X-Real-IP). */
  private resolveIp(req: Request): string {
    const xff = this.headerString(req, 'x-forwarded-for');
    if (xff.length > 0) {
      const first = xff.split(',')[0]?.trim();
      if (first) return first;
    }
    const xRealIp = this.headerString(req, 'x-real-ip');
    if (xRealIp.length > 0) return xRealIp;
    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
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
