/* eslint-disable @typescript-eslint/unbound-method */
import { Body, Controller } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HttpMetricsInterceptor } from '../src/common/interfaces/metrics/http-metrics.interceptor';
import { MetricsService } from '../src/common/interfaces/metrics/metrics.service';
import { FormulairePublic } from '../src/common/interfaces/security/formulaire-public.decorator';
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

describe('Refus anti-robot d un formulaire public — intégration HTTP', () => {
  const metriques = createMockMetricsService();

  const app = applicationDeLaSuite(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])],
      controllers: [FormulaireTemoinController],
      providers: [
        { provide: MetricsService, useValue: metriques },
        { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
      ],
    }).compile();

    return ouvrirApplication(moduleRef);
  });

  it('compte le refus dans les métriques HTTP', async () => {
    await request(httpServerOf(app()))
      .post('/temoin')
      .send({ website: 'https://spam.test' })
      .expect(400);

    expect(metriques.httpRequestsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ route: '/temoin' }),
    );
  });
});
