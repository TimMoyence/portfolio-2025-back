import { MetricsService } from './metrics.service';

// On mock collectDefaultMetrics pour eviter les effets de bord en test
jest.mock('prom-client', () => {
  const actual =
    jest.requireActual<typeof import('prom-client')>('prom-client');
  return {
    ...actual,
    collectDefaultMetrics: jest.fn(),
  };
});

import { collectDefaultMetrics } from 'prom-client';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('devrait creer le compteur http_requests_total', () => {
      expect(service.httpRequestsTotal).toBeDefined();
    });

    it('devrait creer l histogramme http_request_duration_seconds', () => {
      expect(service.httpRequestDuration).toBeDefined();
    });
  });

  describe('onModuleInit', () => {
    it('devrait activer la collecte des metriques par defaut', () => {
      service.onModuleInit();

      expect(collectDefaultMetrics).toHaveBeenCalledWith({
        register: service.getRegistry(),
      });
    });
  });

  describe('getRegistry', () => {
    it('devrait retourner le registre Prometheus', () => {
      const registry = service.getRegistry();

      expect(registry).toBeDefined();
      expect(typeof registry.metrics).toBe('function');
    });
  });

  describe('getMetrics', () => {
    it('devrait retourner une chaine de metriques non vide', async () => {
      // Les metriques custom sont enregistrees dans le registre
      service.httpRequestsTotal.inc({
        method: 'GET',
        route: '/test',
        status_code: '200',
      });

      const metrics = await service.getMetrics();

      expect(typeof metrics).toBe('string');
      expect(metrics).toContain('http_requests_total');
    });
  });

  describe('getContentType', () => {
    it('devrait retourner un content-type text/plain', () => {
      const contentType = service.getContentType();

      expect(contentType).toContain('text/plain');
    });
  });
});
