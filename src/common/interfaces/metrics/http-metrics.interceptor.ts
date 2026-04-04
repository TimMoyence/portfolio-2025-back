import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

/**
 * Intercepteur HTTP qui mesure les metriques de chaque requete.
 *
 * Pour chaque requete entrante, enregistre :
 * - `http_requests_total` : incremente le compteur (method, route, status_code)
 * - `http_request_duration_seconds` : observe la duree (method, route, status_code)
 */
@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();

    const start = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => this.record(req, res, start),
        error: () => this.record(req, res, start),
      }),
    );
  }

  /** Enregistre les metriques HTTP (compteur + histogramme). */
  private record(req: Request, res: Response, start: bigint): void {
    const durationSeconds =
      Number(process.hrtime.bigint() - start) / 1_000_000_000;

    const route =
      (req.route as { path?: string } | undefined)?.path ??
      req.path ??
      'unknown';
    const method = req.method;
    const statusCode = String(res.statusCode);

    const labels = { method, route, status_code: statusCode };

    this.metricsService.httpRequestsTotal.inc(labels);
    this.metricsService.httpRequestDuration.observe(labels, durationSeconds);
  }
}
