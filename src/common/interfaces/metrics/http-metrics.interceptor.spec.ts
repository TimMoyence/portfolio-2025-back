/* eslint-disable @typescript-eslint/unbound-method */
import { EventEmitter } from 'node:events';
import { of, throwError, lastValueFrom } from 'rxjs';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { createMockMetricsService } from '../../../../test/factories/metrics.factory';
import type { MetricsService } from './metrics.service';
import type { ExecutionContext, CallHandler } from '@nestjs/common';

describe('HttpMetricsInterceptor', () => {
  let interceptor: HttpMetricsInterceptor;
  let metricsService: jest.Mocked<MetricsService>;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: { method: string; path: string; route?: { path: string } };
  let mockResponse: EventEmitter & { statusCode: number };

  beforeEach(() => {
    metricsService = createMockMetricsService();
    interceptor = new HttpMetricsInterceptor(metricsService);

    mockRequest = {
      method: 'GET',
      path: '/api/test',
      route: { path: '/api/test' },
    };
    mockResponse = Object.assign(new EventEmitter(), { statusCode: 200 });

    const mockHttpCtx = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpCtx),
    } as unknown as jest.Mocked<ExecutionContext>;

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'ok' })),
    } as jest.Mocked<CallHandler>;
  });

  const LIBELLES_DE_LA_REQUETE = {
    method: 'GET',
    route: '/api/test',
    status_code: '200',
  };

  const intercepter = async () => {
    try {
      return await lastValueFrom(
        interceptor.intercept(mockContext, mockCallHandler),
      );
    } finally {
      mockResponse.emit('close');
    }
  };

  it('devrait incrementer le compteur http_requests_total apres une requete reussie', async () => {
    await intercepter();

    expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledWith(
      LIBELLES_DE_LA_REQUETE,
    );
  });

  it('devrait observer la duree dans l histogramme apres une requete reussie', async () => {
    await intercepter();

    expect(metricsService.httpRequestDuration.observe).toHaveBeenCalledWith(
      LIBELLES_DE_LA_REQUETE,
      expect.any(Number),
    );
  });

  it('devrait enregistrer les metriques meme en cas d erreur', async () => {
    mockCallHandler.handle.mockReturnValue(throwError(() => new Error('boom')));

    await expect(intercepter()).rejects.toThrow('boom');

    expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledWith(
      LIBELLES_DE_LA_REQUETE,
    );
  });

  it('mesure une seule fois une reponse qui emet plusieurs valeurs', async () => {
    mockCallHandler.handle.mockReturnValue(of('a', 'b', 'c'));

    await intercepter();

    expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      'devrait utiliser req.path si req.route est absent',
      () => {
        mockRequest.route = undefined;
        mockRequest.path = '/fallback';
      },
      { route: '/fallback' },
    ],
    [
      'devrait convertir le status_code en string',
      () => {
        mockResponse.statusCode = 404;
      },
      { status_code: '404' },
    ],
  ])('%s', async (_titre, preparer, libellesAttendus) => {
    preparer();

    await intercepter();

    expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining(libellesAttendus),
    );
  });
});
