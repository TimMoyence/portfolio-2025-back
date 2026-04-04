import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  collectDefaultMetrics,
} from 'prom-client';

/**
 * Service de metriques Prometheus.
 *
 * Gere le registre Prometheus, active la collecte des metriques par defaut
 * (CPU, memoire, event loop, GC) et expose des metriques HTTP custom :
 * - `http_requests_total` : compteur de requetes HTTP
 * - `http_request_duration_seconds` : histogramme de duree des requetes
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;
  readonly httpRequestsTotal: Counter;
  readonly httpRequestDuration: Histogram;

  constructor() {
    this.registry = new Registry();

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Nombre total de requetes HTTP',
      labelNames: ['method', 'route', 'status_code'] as const,
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duree des requetes HTTP en secondes',
      labelNames: ['method', 'route', 'status_code'] as const,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });
  }

  /** Active la collecte des metriques par defaut au demarrage du module. */
  onModuleInit(): void {
    collectDefaultMetrics({ register: this.registry });
  }

  /** Retourne le registre Prometheus. */
  getRegistry(): Registry {
    return this.registry;
  }

  /** Retourne les metriques formatees pour Prometheus (text/plain). */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /** Retourne le content-type attendu par Prometheus. */
  getContentType(): string {
    return this.registry.contentType;
  }
}
