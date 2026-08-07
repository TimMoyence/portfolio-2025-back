import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;
  readonly httpRequestsTotal: Counter;
  readonly httpRequestDuration: Histogram;
  readonly llmTokensTotal: Counter;
  readonly llmLatencySeconds: Histogram;
  readonly llmCallsTotal: Counter;

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

    this.llmTokensTotal = new Counter({
      name: 'llm_tokens_total',
      help: 'Nombre total de tokens LLM consommes',
      labelNames: ['model', 'section', 'locale', 'type'] as const,
      registers: [this.registry],
    });

    this.llmLatencySeconds = new Histogram({
      name: 'llm_latency_seconds',
      help: "Duree d'une invocation LLM en secondes",
      labelNames: ['model', 'section', 'locale', 'status'] as const,
      buckets: [0.5, 1, 2, 5, 10, 20, 30, 60, 120],
      registers: [this.registry],
    });

    this.llmCallsTotal = new Counter({
      name: 'llm_calls_total',
      help: "Nombre total d'invocations LLM",
      labelNames: ['model', 'section', 'locale', 'status'] as const,
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    collectDefaultMetrics({ register: this.registry });
  }

  getRegistry(): Registry {
    return this.registry;
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
