/* eslint-disable @typescript-eslint/unbound-method */
import { of, throwError, firstValueFrom } from 'rxjs';
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
  let mockResponse: { statusCode: number };

  beforeEach(() => {
    metricsService = createMockMetricsService();
    interceptor = new HttpMetricsInterceptor(metricsService);

    mockRequest = {
      method: 'GET',
      path: '/api/test',
      route: { path: '/api/test' },
    };
    mockResponse = { statusCode: 200 };

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

  it('devrait incrementer le compteur http_requests_total apres une requete reussie', async () => {
    const result$ = interceptor.intercept(mockContext, mockCallHandler);
    await firstValueFrom(result$);

    expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledWith({
      method: 'GET',
      route: '/api/test',
      status_code: '200',
    });
  });

  it('devrait observer la duree dans l histogramme apres une requete reussie', async () => {
    const result$ = interceptor.intercept(mockContext, mockCallHandler);
    await firstValueFrom(result$);

    expect(metricsService.httpRequestDuration.observe).toHaveBeenCalledWith(
      { method: 'GET', route: '/api/test', status_code: '200' },
      expect.any(Number),
    );
  });

  it('devrait enregistrer les metriques meme en cas d erreur', async () => {
    mockCallHandler.handle.mockReturnValue(throwError(() => new Error('boom')));

    const result$ = interceptor.intercept(mockContext, mockCallHandler);

    await expect(firstValueFrom(result$)).rejects.toThrow('boom');

    expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledWith({
      method: 'GET',
      route: '/api/test',
      status_code: '200',
    });
  });

  it('devrait utiliser req.path si req.route est absent', async () => {
    mockRequest.route = undefined;
    mockRequest.path = '/fallback';

    const result$ = interceptor.intercept(mockContext, mockCallHandler);
    await firstValueFrom(result$);

    expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ route: '/fallback' }),
    );
  });

  it('devrait convertir le status_code en string', async () => {
    mockResponse.statusCode = 404;

    const result$ = interceptor.intercept(mockContext, mockCallHandler);
    await firstValueFrom(result$);

    expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ status_code: '404' }),
    );
  });
});
