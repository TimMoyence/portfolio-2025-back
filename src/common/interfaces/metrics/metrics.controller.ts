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

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Recuperer les metriques Prometheus (scraping)' })
  @ApiOkResponse({ description: 'Metriques au format Prometheus text/plain' })
  async getMetrics(@Res() res: Response): Promise<void> {
    const metrics = await this.metricsService.getMetrics();
    res.set('Content-Type', this.metricsService.getContentType());
    res.end(metrics);
  }

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
