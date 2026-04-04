import { Controller, Get, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { MetricsService } from './metrics.service';

/**
 * Controller de metriques Prometheus.
 *
 * Expose un endpoint GET `/metrics` public qui retourne les metriques
 * au format Prometheus text/plain. Le endpoint est exempt de rate-limiting
 * et d'authentification pour permettre le scraping Prometheus.
 */
@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Retourne toutes les metriques Prometheus (defaut + custom).
   *
   * Le content-type est dynamiquement defini par prom-client
   * pour assurer la compatibilite avec le format attendu par Prometheus.
   */
  @Get()
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: 'Recuperer les metriques Prometheus (scraping)' })
  @ApiOkResponse({ description: 'Metriques au format Prometheus text/plain' })
  async getMetrics(@Res() res: Response): Promise<void> {
    const metrics = await this.metricsService.getMetrics();
    res.set('Content-Type', this.metricsService.getContentType());
    res.end(metrics);
  }
}
