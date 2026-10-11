/* eslint-disable @typescript-eslint/unbound-method */
import {
  Body,
  type CanActivate,
  Controller,
  type ExecutionContext,
  Get,
  type MessageEvent,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import type { Response } from 'express';
import { once } from 'node:events';
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
import { abonnerAuFlux, attendreQue } from './helpers/formations-harness';
import {
  ADRESSE_BOUCLE_LOCALE,
  applicationDeLaSuite,
  httpServerOf,
  ouvrirApplication,
  portDe,
  preparerChaqueRequete,
} from './helpers/nest-test-app';

const ATTENTE_MAX_MS = 2000;

let signalerLArriveeALaGarde: () => void = () => undefined;

function arriveeALaGarde(): Promise<void> {
  return new Promise((resoudre) => {
    signalerLArriveeALaGarde = resoudre;
  });
}

class GardeQuiAttendLaCoupure implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const reponse = context.switchToHttp().getResponse<Response>();
    signalerLArriveeALaGarde();
    if (!reponse.destroyed) await once(reponse, 'close');
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
  @UseGuards(GardeQuiAttendLaCoupure)
  lent(): string {
    return 'ok';
  }

  @Sse('flux')
  flux(): Observable<MessageEvent> {
    return interval(5).pipe(map((n) => ({ type: 'tic', data: { n } })));
  }
}

function couperLaRequeteALaGarde(
  port: number,
  chemin: string,
): Promise<NodeJS.ErrnoException> {
  const arrivee = arriveeALaGarde();
  return new Promise((resoudre) => {
    const requete = requeteNode({
      host: ADRESSE_BOUCLE_LOCALE,
      port,
      path: chemin,
    });
    requete.once('error', resoudre);
    requete.end();
    void arrivee.then(() => requete.destroy());
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

  function verifierUneSeuleMesure(route: string, statut: string): void {
    expect(metriques.httpRequestsTotal.inc).toHaveBeenCalledTimes(1);
    expect(metriques.httpRequestsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ route, status_code: statut }),
    );
  }

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

      verifierUneSeuleMesure('/temoin', String(statut));
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
    statut: string,
  ): Promise<{ abandonnee: boolean }> {
    await attendreQue(
      () => enregistrement.mock.calls.length > 0,
      ATTENTE_MAX_MS,
    );
    verifierUneSeuleMesure(chemin, statut);
    expect(enregistrement).toHaveBeenCalledTimes(1);
    const [evenement] = enregistrement.mock.calls[0];
    expect(evenement.path).toBe(chemin);
    return { abandonnee: evenement.reasons.includes('http:aborted') };
  }

  it('mesure en 499 et note abandonnée une requête coupée avant les intercepteurs', async () => {
    await expect(
      couperLaRequeteALaGarde(portDe(app()), '/lent'),
    ).resolves.toMatchObject({ code: 'ECONNRESET' });

    expect(await seuleMesureApresFermeture('/lent', '499')).toEqual({
      abandonnee: true,
    });
  });

  it('ne note pas abandonné un flux SSE que le client referme', async () => {
    const flux = await abonnerAuFlux(portDe(app()), '/flux', {});
    await attendreQue(() => flux.evenements.length > 0, ATTENTE_MAX_MS);
    flux.fermer();

    expect(await seuleMesureApresFermeture('/flux', '200')).toEqual({
      abandonnee: false,
    });
  });
});
