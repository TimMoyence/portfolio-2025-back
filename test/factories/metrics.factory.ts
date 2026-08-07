import type { MetricsService } from '../../src/common/interfaces/metrics/metrics.service';

export function createMockMetricsService(): jest.Mocked<MetricsService> {
  return {
    httpRequestsTotal: {
      inc: jest.fn(),
    },
    httpRequestDuration: {
      observe: jest.fn(),
    },
    onModuleInit: jest.fn(),
    getRegistry: jest.fn(),
    getMetrics: jest.fn().mockResolvedValue('# HELP http_requests_total\n'),
    getContentType: jest
      .fn()
      .mockReturnValue('text/plain; version=0.0.4; charset=utf-8'),
  } as unknown as jest.Mocked<MetricsService>;
}
