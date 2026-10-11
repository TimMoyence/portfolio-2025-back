/* eslint-disable @typescript-eslint/unbound-method */
import {
  Body,
  type CanActivate,
  Controller,
  Get,
  type MessageEvent,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import { request as requeteNode } from 'node:http';
import { interval, map, type Observable } from 'rxjs';
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
  abonnerAuFlux,
  attendreQue,
  patienter,
} from './helpers/formations-harness';
import {
  ADRESSE_BOUCLE_LOCALE,
  applicationDeLaSuite,
  httpServerOf,
  ouvrirApplication,
  portDe,
  preparerChaqueRequete,
} from './helpers/nest-test-app';

const DUREE_DE_LA_GARDE_MS = 100;
const COUPURE_DU_CLIENT_MS = 20;
const ATTENTE_MAX_MS = 2000;

class GardeLente implements CanActivate {
  async canActivate(): Promise<boolean> {
    await patienter(DUREE_DE_LA_GARDE_MS);
    return true;
  }
}

@Controller()
class FormulaireTemoinController {
  @FormulairePublic(5, 'temoin')
  soumettre(@Body() corps: unknown): unknown {
    return corps;
  }

  @Get('lent')
  @UseGuards(GardeLente)
  lent(): string {
    return 'ok';
  }

  @Sse('flux')
  flux(): Observable<MessageEvent> {
    return interval(5).pipe(map((n) => ({ type: 'tic', data: { n } })));
  }
}

function couperLaRequete(
  port: number,
  chemin: string,
): Promise<NodeJS.ErrnoException> {
  return new Promise((resoudre) => {
    const requete = requeteNode({
      host: ADRESSE_BOUCLE_LOCALE,
      port,
      path: chemin,
    });
    requete.once('error', resoudre);
    requete.end();
    setTimeout(() => requete.destroy(), COUPURE_DU_CLIENT_MS);
  });
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
      preparerChaqueRequete(application, (req) => {
        Object.defineProperty(req.socket, 'remoteAddress', {
          value: IP_DISTANTE,
          configurable: true,
        });
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

  async function seuleMesureApresFermeture(
    chemin: string,
  ): Promise<{ abandonnee: boolean }> {
    await attendreQue(
      () => enregistrement.mock.calls.length > 0,
      DUREE_DE_LA_GARDE_MS + ATTENTE_MAX_MS,
    );
    expect(metriques.httpRequestsTotal.inc).toHaveBeenCalledTimes(1);
    expect(enregistrement).toHaveBeenCalledTimes(1);
    const [evenement] = enregistrement.mock.calls[0];
    expect(evenement.path).toBe(chemin);
    return { abandonnee: evenement.reasons.includes('http:aborted') };
  }

  it('mesure et note abandonnée une requête coupée avant les intercepteurs', async () => {
    await expect(
      couperLaRequete(portDe(app()), '/lent'),
    ).resolves.toMatchObject({ code: 'ECONNRESET' });

    expect(await seuleMesureApresFermeture('/lent')).toEqual({
      abandonnee: true,
    });
  });

  it('ne note pas abandonné un flux SSE que le client referme', async () => {
    const flux = await abonnerAuFlux(portDe(app()), '/flux', {});
    await attendreQue(() => flux.evenements.length > 0, ATTENTE_MAX_MS);
    flux.fermer();

    expect(await seuleMesureApresFermeture('/flux')).toEqual({
      abandonnee: false,
    });
  });
});
