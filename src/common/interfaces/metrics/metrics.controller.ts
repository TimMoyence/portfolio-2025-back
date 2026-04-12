import { Controller, Get, Inject, Res, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import type { ISecurityEventsStore } from '../security/ISecurityEventsStore';
import { SECURITY_EVENTS_STORE } from '../security/ISecurityEventsStore';
import type { SecurityConfig } from '../security/security.config';
import { SECURITY_CONFIG } from '../security/security.tokens';
import { MetricsAuthGuard } from './metrics-auth.guard';
import { MetricsService } from './metrics.service';

/**
 * Reponse JSON de l'endpoint /metrics/security.
 *
 * Exposee aux operateurs pour triage rapide : liste triee des IPs
 * suspectes sur la fenetre d'observation, avec contexte de la derniere
 * requete (raisons de scoring, path, user-agent). Les donnees ne sont
 * pas persistees en base : elles vivent dans un store dedouble en memoire
 * purge a la lecture.
 */
export interface SecuritySummaryResponse {
  windowMs: number;
  generatedAt: string;
  threshold: number;
  topSuspiciousIps: Array<{
    ip: string;
    count: number;
    lastSeenAt: string;
    lastScore: number;
    lastReasons: string[];
    lastPath: string;
    lastUserAgent: string;
  }>;
}

/**
 * Controller de metriques.
 *
 * Expose :
 * - `GET /metrics` : metriques Prometheus (text/plain)
 * - `GET /metrics/security` : top-N des IPs suspectes detectees par
 *   l'intercepteur, au format JSON pour inspection humaine.
 *
 * Les deux endpoints sont proteges par le meme token statique
 * (`METRICS_TOKEN`) et sont exempts de rate-limiting (scraping).
 */
@ApiTags('metrics')
@Controller('metrics')
@UseGuards(MetricsAuthGuard)
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    @Inject(SECURITY_EVENTS_STORE)
    private readonly securityStore: ISecurityEventsStore,
    @Inject(SECURITY_CONFIG)
    private readonly securityConfig: SecurityConfig,
  ) {}

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

  /**
   * Retourne le top-N des IPs suspectes detectees sur la fenetre
   * d'observation configuree (par defaut 24h).
   *
   * Sert au triage manuel : identifier rapidement qui scanne le site,
   * depuis quelle IP, via quels signaux. Les decisions de blocage
   * (fail2ban, iptables) sont prises hors de l'application.
   */
  @Get('security')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Top-N des IPs suspectes detectees dans la fenetre active',
  })
  @ApiOkResponse({ description: 'Resume JSON du top des IPs suspectes' })
  async getSecuritySummary(): Promise<SecuritySummaryResponse> {
    const summaries = await this.securityStore.getTopIPs(
      this.securityConfig.topEventsLimit,
      this.securityConfig.reportWindowMs,
    );

    return {
      windowMs: this.securityConfig.reportWindowMs,
      threshold: this.securityConfig.suspiciousScoreThreshold,
      generatedAt: new Date().toISOString(),
      topSuspiciousIps: summaries.map((s) => ({
        ip: s.ip,
        count: s.count,
        lastSeenAt: new Date(s.lastSeenMs).toISOString(),
        lastScore: s.lastScore,
        lastReasons: s.lastReasons,
        lastPath: s.lastPath,
        lastUserAgent: s.lastUserAgent,
      })),
    };
  }
}
