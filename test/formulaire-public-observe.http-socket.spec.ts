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
import { FormulairePublic } from '../src/common/interfaces/security/formulaire-public.decorator';
import { loadSecurityConfig } from '../src/common/interfaces/security/security.config';
import { SECURITY_CONFIG } from '../src/common/interfaces/security/security.tokens';
import { SuspiciousRequestInterceptor } from '../src/common/interfaces/security/suspicious-request.interceptor';
import { espionnerLesAvertissements } from './helpers/avertissements';
import { abonnerAuFlux, attendreQue } from './helpers/formations-harness';
import {
  ADRESSE_BOUCLE_LOCALE,
  applicationDeLaSuite,
  serveurHttpDe,
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
  const avertissements = espionnerLesAvertissements();

  const app = applicationDeLaSuite(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])],
      controllers: [FormulaireTemoinController],
      providers: [
        {
          provide: SECURITY_CONFIG,
          useValue: { ...loadSecurityConfig(), suspiciousScoreThreshold: 0 },
        },
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

  const tracesSuspectes = (): string[] =>
    avertissements()
      .mock.calls.map(([message]) => String(message))
      .filter((message) => message.startsWith('[SECURITY] suspicious '));

  async function seuleTraceApresFermeture(chemin: string): Promise<string> {
    await attendreQue(() => tracesSuspectes().length > 0, ATTENTE_MAX_MS);
    const traces = tracesSuspectes();
    expect(traces).toHaveLength(1);
    expect(traces[0]).toContain(` ip=${IP_DISTANTE} `);
    expect(traces[0]).toContain(` path=${chemin} `);
    return traces[0];
  }

  it.each([
    ['un refus', { website: 'https://spam.test' }, 400],
    ['une soumission acceptée', {}, 201],
  ])(
    'journalise %s une seule fois, avec le statut renvoyé au client',
    async (_cas, corps, statut) => {
      await request(serveurHttpDe(app()))
        .post('/temoin')
        .send(corps)
        .expect(statut);

      const trace = await seuleTraceApresFermeture('/temoin');
      expect(trace).toContain(` status=${statut} `);
      expect(trace).toMatch(/ aborted=false$/);
    },
  );

  it('note abandonnée une requête coupée avant les intercepteurs', async () => {
    await expect(
      couperLaRequeteALaGarde(portDe(app()), '/lent'),
    ).resolves.toMatchObject({ code: 'ECONNRESET' });

    expect(await seuleTraceApresFermeture('/lent')).toMatch(/ aborted=true$/);
  });

  it('ne note pas abandonné un flux SSE que le client referme', async () => {
    const flux = await abonnerAuFlux(portDe(app()), '/flux', {});
    await attendreQue(() => flux.evenements.length > 0, ATTENTE_MAX_MS);
    flux.fermer();

    expect(await seuleTraceApresFermeture('/flux')).toMatch(/ aborted=false$/);
  });
});
