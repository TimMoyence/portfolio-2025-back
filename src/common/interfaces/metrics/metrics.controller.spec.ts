/* eslint-disable @typescript-eslint/unbound-method */
import { MetricsController } from './metrics.controller';
import { createMockMetricsService } from '../../../../test/factories/metrics.factory';
import { InMemorySecurityEventsStore } from '../security/in-memory-security-events-store';
import type { SecurityConfig } from '../security/security.config';
import type { MetricsService } from './metrics.service';
import type { Response } from 'express';

describe('MetricsController', () => {
  let controller: MetricsController;
  let metricsService: jest.Mocked<MetricsService>;
  let mockResponse: jest.Mocked<Pick<Response, 'set' | 'end'>>;
  let securityStore: InMemorySecurityEventsStore;
  let securityConfig: SecurityConfig;

  beforeEach(() => {
    metricsService = createMockMetricsService();
    securityStore = new InMemorySecurityEventsStore();
    securityConfig = {
      suspiciousScoreThreshold: 25,
      reportWindowMs: 24 * 60 * 60 * 1000,
      topEventsLimit: 10,
    };
    controller = new MetricsController(
      metricsService,
      securityStore,
      securityConfig,
    );

    mockResponse = {
      set: jest.fn(),
      end: jest.fn(),
    };
  });

  describe('getMetrics', () => {
    it('devrait retourner les metriques avec le content-type Prometheus', async () => {
      const metricsOutput = '# HELP http_requests_total\n';
      metricsService.getMetrics.mockResolvedValue(metricsOutput);
      metricsService.getContentType.mockReturnValue(
        'text/plain; version=0.0.4; charset=utf-8',
      );

      await controller.getMetrics(mockResponse as unknown as Response);

      expect(metricsService.getMetrics).toHaveBeenCalled();
      expect(mockResponse.set).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain; version=0.0.4; charset=utf-8',
      );
      expect(mockResponse.end).toHaveBeenCalledWith(metricsOutput);
    });

    it('devrait appeler getContentType pour le content-type dynamique', async () => {
      await controller.getMetrics(mockResponse as unknown as Response);

      expect(metricsService.getContentType).toHaveBeenCalled();
    });
  });

  describe('getSecuritySummary', () => {
    it('retourne un top vide quand aucun evenement enregistre', async () => {
      const result = await controller.getSecuritySummary();
      expect(result.topSuspiciousIps).toEqual([]);
      expect(result.windowMs).toBe(24 * 60 * 60 * 1000);
      expect(result.threshold).toBe(25);
      expect(() => new Date(result.generatedAt).toISOString()).not.toThrow();
    });

    it('expose les IPs deja enregistrees par le store', async () => {
      const now = Date.now();
      await securityStore.recordEvent({
        ip: '135.125.11.41',
        userAgent: 'HeadlessChrome/145',
        method: 'POST',
        path: '/cookie-consents',
        statusCode: 201,
        score: 45,
        reasons: ['ua:headless-chrome', 'http:aborted'],
        occurredAtMs: now,
      });
      await securityStore.recordEvent({
        ip: '135.125.11.41',
        userAgent: 'HeadlessChrome/145',
        method: 'POST',
        path: '/cookie-consents',
        statusCode: 201,
        score: 45,
        reasons: ['ua:headless-chrome', 'http:aborted'],
        occurredAtMs: now + 10,
      });

      const result = await controller.getSecuritySummary();

      expect(result.topSuspiciousIps).toHaveLength(1);
      const row = result.topSuspiciousIps[0];
      expect(row.ip).toBe('135.125.11.41');
      expect(row.count).toBe(2);
      expect(row.lastReasons).toContain('ua:headless-chrome');
      expect(row.lastPath).toBe('/cookie-consents');
      expect(() => new Date(row.lastSeenAt).toISOString()).not.toThrow();
    });

    it('respecte topEventsLimit', async () => {
      securityConfig.topEventsLimit = 2;
      for (let i = 0; i < 5; i++) {
        await securityStore.recordEvent({
          ip: `10.0.0.${i}`,
          userAgent: 'HeadlessChrome',
          method: 'GET',
          path: '/',
          statusCode: 200,
          score: 30,
          reasons: ['ua:headless-chrome'],
          occurredAtMs: Date.now() + i,
        });
      }

      const result = await controller.getSecuritySummary();
      expect(result.topSuspiciousIps).toHaveLength(2);
    });
  });
});
