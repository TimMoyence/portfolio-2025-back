import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();

    const start = process.hrtime.bigint();
    res.once('close', () => this.record(req, res, start));

    return next.handle();
  }

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
