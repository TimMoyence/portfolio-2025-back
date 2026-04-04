import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';

/**
 * Module global de metriques Prometheus.
 *
 * Expose un endpoint `/metrics` public et enregistre un intercepteur
 * global qui mesure les requetes HTTP (compteur + histogramme).
 * Le module est global pour que `MetricsService` soit injectable partout.
 */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    MetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
