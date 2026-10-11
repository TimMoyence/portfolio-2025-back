import {
  Injectable,
  Logger,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { HttpArgumentsHost } from '@nestjs/common/interfaces';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { aLaFermeture } from '../http/a-la-fermeture';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpMetrics');

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() === 'http') {
      const start = process.hrtime.bigint();
      aLaFermeture(context, () => this.record(context.switchToHttp(), start));
    }
    return next.handle();
  }

  private record(http: HttpArgumentsHost, start: bigint): void {
    try {
      const durationSeconds =
        Number(process.hrtime.bigint() - start) / 1_000_000_000;

      const req = http.getRequest<Request>();
      const route =
        (req.route as { path?: string } | undefined)?.path ??
        req.path ??
        'unknown';
      const method = req.method;
      const statusCode = String(http.getResponse<Response>().statusCode);

      const labels = { method, route, status_code: statusCode };

      this.metricsService.httpRequestsTotal.inc(labels);
      this.metricsService.httpRequestDuration.observe(labels, durationSeconds);
    } catch (err) {
      this.logger.warn(`[METRICS] mesure non enregistree : ${String(err)}`);
    }
  }
}
