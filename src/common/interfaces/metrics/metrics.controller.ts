import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { MetricsAuthGuard } from './metrics-auth.guard';
import { MetricsService } from './metrics.service';

/**
 * Controller de metriques Prometheus.
 *
 * Expose un endpoint GET `/metrics` protege par un token statique
 * (`METRICS_TOKEN`) au format Prometheus text/plain. Le endpoint est
 * exempt de rate-limiting pour permettre le scraping frequent par Prometheus.
 */
@ApiTags('metrics')
@Controller('metrics')
@UseGuards(MetricsAuthGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Retourne toutes les metriques Prometheus (defaut + custom).
   *
   * Le content-type est dynamiquement defini par prom-client
   * pour assurer la compatibilite avec le format attendu par Prometheus.
   * Necessite un header `Authorization: Bearer <METRICS_TOKEN>`.
   */
  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Recuperer les metriques Prometheus (scraping)' })
  @ApiOkResponse({ description: 'Metriques au format Prometheus text/plain' })
  async getMetrics(@Res() res: Response): Promise<void> {
    const metrics = await this.metricsService.getMetrics();
    res.set('Content-Type', this.metricsService.getContentType());
    res.end(metrics);
  }
}
