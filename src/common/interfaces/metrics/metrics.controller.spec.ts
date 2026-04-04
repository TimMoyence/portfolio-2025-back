/* eslint-disable @typescript-eslint/unbound-method */
import { MetricsController } from './metrics.controller';
import { createMockMetricsService } from '../../../../test/factories/metrics.factory';
import type { MetricsService } from './metrics.service';
import type { Response } from 'express';

describe('MetricsController', () => {
  let controller: MetricsController;
  let metricsService: jest.Mocked<MetricsService>;
  let mockResponse: jest.Mocked<Pick<Response, 'set' | 'end'>>;

  beforeEach(() => {
    metricsService = createMockMetricsService();
    controller = new MetricsController(metricsService);

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
});
