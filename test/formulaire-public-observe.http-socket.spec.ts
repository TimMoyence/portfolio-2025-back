/* eslint-disable @typescript-eslint/unbound-method */
import { Body, Controller } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { HttpMetricsInterceptor } from '../src/common/interfaces/metrics/http-metrics.interceptor';
import { MetricsService } from '../src/common/interfaces/metrics/metrics.service';
import { FormulairePublic } from '../src/common/interfaces/security/formulaire-public.decorator';
import { SECURITY_EVENTS_STORE } from '../src/common/interfaces/security/ISecurityEventsStore';
import { InMemorySecurityEventsStore } from '../src/common/interfaces/security/in-memory-security-events-store';
import { loadSecurityConfig } from '../src/common/interfaces/security/security.config';
import { SECURITY_CONFIG } from '../src/common/interfaces/security/security.tokens';
import { SuspiciousRequestInterceptor } from '../src/common/interfaces/security/suspicious-request.interceptor';
import { createMockMetricsService } from './factories/metrics.factory';
import {
  applicationDeLaSuite,
  httpServerOf,
  ouvrirApplication,
} from './helpers/nest-test-app';

@Controller()
class FormulaireTemoinController {
  @FormulairePublic(5, 'temoin')
  soumettre(@Body() corps: unknown): unknown {
    return corps;
  }
}

const IP_DISTANTE = '203.0.113.7';

describe('Refus anti-robot d un formulaire public — intégration HTTP', () => {
  const metriques = createMockMetricsService();
  const evenements = new InMemorySecurityEventsStore();
  const enregistrement = jest.spyOn(evenements, 'recordEvent');

  const app = applicationDeLaSuite(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])],
      controllers: [FormulaireTemoinController],
      providers: [
        { provide: MetricsService, useValue: metriques },
        { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
        {
          provide: SECURITY_CONFIG,
          useValue: { ...loadSecurityConfig(), suspiciousScoreThreshold: 0 },
        },
        { provide: SECURITY_EVENTS_STORE, useValue: evenements },
        { provide: APP_INTERCEPTOR, useClass: SuspiciousRequestInterceptor },
      ],
    }).compile();

    return ouvrirApplication(moduleRef, (application) => {
      application.use((req: Request, _res: Response, next: NextFunction) => {
        Object.defineProperty(req.socket, 'remoteAddress', {
          value: IP_DISTANTE,
          configurable: true,
        });
        next();
      });
    });
  });

  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['un refus', { website: 'https://spam.test' }, 400],
    ['une soumission acceptée', {}, 201],
  ])(
    'mesure %s une seule fois, avec le statut renvoyé au client',
    async (_cas, corps, statut) => {
      await request(httpServerOf(app()))
        .post('/temoin')
        .send(corps)
        .expect(statut);

      expect(metriques.httpRequestsTotal.inc).toHaveBeenCalledTimes(1);
      expect(metriques.httpRequestsTotal.inc).toHaveBeenCalledWith(
        expect.objectContaining({
          route: '/temoin',
          status_code: String(statut),
        }),
      );
      expect(enregistrement).toHaveBeenCalledTimes(1);
      expect(enregistrement).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: IP_DISTANTE,
          statusCode: statut,
          reasons: expect.not.arrayContaining(['http:aborted']) as unknown,
        }),
      );
    },
  );
});
