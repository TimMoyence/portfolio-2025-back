/* eslint-disable @typescript-eslint/unbound-method */
import { of, throwError, lastValueFrom } from 'rxjs';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { createMockMetricsService } from '../../../../test/factories/metrics.factory';
import { sousUneDureeDe } from '../../../../test/helpers/horloge';
import { espionnerLeLogger } from '../../../../test/helpers/silence-nest-logger';
import {
  createFakeHttpResponse,
  createHttpExecutionContext,
  createRpcExecutionContext,
  type FausseReponseHttp,
} from '../../../../test/factories/execution-context.factory';
import type { MetricsService } from './metrics.service';
import type { CallHandler } from '@nestjs/common';

describe('HttpMetricsInterceptor', () => {
  let interceptor: HttpMetricsInterceptor;
  let metricsService: jest.Mocked<MetricsService>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: { method: string; path: string; route?: { path: string } };
  let mockResponse: FausseReponseHttp;

  beforeEach(() => {
    metricsService = createMockMetricsService();
    interceptor = new HttpMetricsInterceptor(metricsService);

    mockRequest = {
      method: 'GET',
      path: '/api/test',
      route: { path: '/api/test' },
    };
    mockResponse = createFakeHttpResponse();

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'ok' })),
    } as jest.Mocked<CallHandler>;
  });

  const LIBELLES_DE_LA_REQUETE = {
    method: 'GET',
    route: '/api/test',
    status_code: '200',
  };

  const intercepterSansFermer = () =>
    lastValueFrom(
      interceptor.intercept(
        createHttpExecutionContext(mockRequest, mockResponse),
        mockCallHandler,
      ),
    );

  const intercepter = async () => {
    try {
      return await intercepterSansFermer();
    } finally {
      mockResponse.emit('close');
    }
  };

  it('laisse passer un contexte non HTTP sans le mesurer', async () => {
    await expect(
      lastValueFrom(
        interceptor.intercept(createRpcExecutionContext(), mockCallHandler),
      ),
    ).resolves.toEqual({ data: 'ok' });

    expect(metricsService.httpRequestsTotal.inc).not.toHaveBeenCalled();
  });

  it('mesure une reponse deja fermee avant l intercepteur, comme abandonnee par le client', async () => {
    mockResponse.destroyed = true;
    mockResponse.writableFinished = false;

    await intercepterSansFermer();

    expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledTimes(1);
    expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledWith({
      ...LIBELLES_DE_LA_REQUETE,
      status_code: '499',
    });
  });

  it('journalise sans lever quand l enregistrement de la mesure casse', async () => {
    const journal = espionnerLeLogger('warn');
    jest.mocked(metricsService.httpRequestsTotal.inc).mockImplementation(() => {
      throw new Error('libelles incoherents');
    });

    try {
      await expect(intercepter()).resolves.toEqual({ data: 'ok' });
      expect(journal).toHaveBeenCalledWith(
        expect.stringContaining('libelles incoherents'),
      );
    } finally {
      journal.mockRestore();
    }
  });

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

  it('observe en secondes la duree ecoulee entre l entree et la fermeture', async () => {
    await sousUneDureeDe(2.5, () => intercepter());

    expect(metricsService.httpRequestDuration.observe).toHaveBeenCalledWith(
      LIBELLES_DE_LA_REQUETE,
      0.0025,
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
    [
      'compte en 499 une reponse que le client ferme avant qu elle soit terminee',
      () => {
        mockResponse.writableFinished = false;
      },
      { status_code: '499' },
    ],
  ])('%s', async (_titre, preparer, libellesAttendus) => {
    preparer();

    await intercepter();

    expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining(libellesAttendus),
    );
  });
});
