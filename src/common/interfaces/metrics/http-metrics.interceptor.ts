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
import { dureeEnMsDepuis, instantEnNs } from '../http/duree-de-requete';
import { MetricsService } from './metrics.service';

const STATUT_DU_CLIENT_PARTI = '499';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpMetrics');

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() === 'http') {
      const start = instantEnNs();
      aLaFermeture(context, (abandonnee) =>
        this.record(context.switchToHttp(), start, abandonnee),
      );
    }
    return next.handle();
  }

  private record(
    http: HttpArgumentsHost,
    start: bigint,
    abandonnee: boolean,
  ): void {
    try {
      const durationSeconds = dureeEnMsDepuis(start) / 1000;

      const req = http.getRequest<Request>();
      const route =
        (req.route as { path?: string } | undefined)?.path ??
        req.path ??
        'unknown';
      const method = req.method;
      const statusCode = abandonnee
        ? STATUT_DU_CLIENT_PARTI
        : String(http.getResponse<Response>().statusCode);

      const labels = { method, route, status_code: statusCode };

      this.metricsService.httpRequestsTotal.inc(labels);
      this.metricsService.httpRequestDuration.observe(labels, durationSeconds);
    } catch (err) {
      this.logger.warn(`[METRICS] mesure non enregistree : ${String(err)}`);
    }
  }
}
