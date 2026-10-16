import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Sse,
  type INestApplication,
  type MessageEvent,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { from, type Observable } from 'rxjs';
import request from 'supertest';
import { abonnerAuFlux, attendreQue } from './helpers/formations-harness';
import {
  fermerApplication,
  httpServerOf,
  ouvrirApplication,
  portDe,
} from './helpers/nest-test-app';
import { DOSSIER_DES_REPONSES_SERVIES } from './helpers/reponses-servies';

interface ReponseConsignee {
  route: string;
  corps: unknown;
}

@Controller('essai')
class EssaiController {
  @Get('cours/:slug')
  cours(@Param('slug') slug: string, @Query('vide') vide?: string) {
    return vide === undefined
      ? {
          slug,
          ecrans: [
            { id: 'e1', duree: 3 },
            { id: 'e2', duree: 4 },
          ],
        }
      : { slug, ecrans: [] };
  }

  @Get('refus')
  refus(): never {
    throw new BadRequestException('refusé');
  }

  @Sse('flux')
  flux(): Observable<MessageEvent> {
    return from([
      { type: 'etat', data: { ecranCourant: 2, revele: false } },
      { type: 'etat', data: { ecranCourant: 3, revele: true } },
      { type: 'fin', data: { motif: 'close' } },
    ]);
  }
}

async function monter(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [EssaiController],
  }).compile();
  return ouvrirApplication(moduleRef);
}

function consignees(dossier: string): ReponseConsignee[] {
  if (!existsSync(dossier)) {
    return [];
  }
  return readdirSync(dossier)
    .map(
      (nom) =>
        JSON.parse(
          readFileSync(join(dossier, nom), 'utf8'),
        ) as ReponseConsignee,
    )
    .sort((a, b) =>
      `${a.route}${JSON.stringify(a.corps)}`.localeCompare(
        `${b.route}${JSON.stringify(b.corps)}`,
      ),
    );
}

describe('Réponses servies consignées pour les schémas du front (L2b-REPONSES-SERVIES)', () => {
  let dossier: string;
  let app: INestApplication;

  beforeEach(async () => {
    dossier = join(mkdtempSync(join(tmpdir(), 'reponses-servies-')), 'sortie');
    process.env[DOSSIER_DES_REPONSES_SERVIES] = dossier;
    app = await monter();
  });

  afterEach(async () => {
    await fermerApplication(app);
    delete process.env[DOSSIER_DES_REPONSES_SERVIES];
    rmSync(join(dossier, '..'), { recursive: true, force: true });
  });

  it('consigne un corps JSON servi sous sa route, paramètres non résolus', async () => {
    await request(httpServerOf(app)).get('/essai/cours/b2-03').expect(200);

    expect(consignees(dossier)).toEqual([
      {
        route: 'GET /essai/cours/:slug',
        corps: {
          slug: 'b2-03',
          ecrans: [
            { id: 'e1', duree: 3 },
            { id: 'e2', duree: 4 },
          ],
        },
      },
    ]);
  });

  it('garde une réponse par forme de clés : la même forme rejouée ne se consigne pas deux fois', async () => {
    const http = request(httpServerOf(app));
    await http.get('/essai/cours/b2-03').expect(200);
    await http.get('/essai/cours/b3-01').expect(200);
    await http.get('/essai/cours/b2-03?vide=1').expect(200);

    expect(consignees(dossier).map(({ corps }) => corps)).toEqual([
      { slug: 'b2-03', ecrans: [] },
      {
        slug: 'b3-01',
        ecrans: [
          { id: 'e1', duree: 3 },
          { id: 'e2', duree: 4 },
        ],
      },
    ]);
  });

  it('ne consigne pas une réponse d’erreur', async () => {
    await request(httpServerOf(app)).get('/essai/refus').expect(400);

    expect(consignees(dossier)).toEqual([]);
  });

  it('consigne chaque trame du flux sous sa route et son événement, une par forme', async () => {
    const flux = await abonnerAuFlux(portDe(app), '/essai/flux', {});
    await attendreQue(() => flux.ferme, 2000);

    expect(flux.evenements.map(({ type }) => type)).toEqual([
      'etat',
      'etat',
      'fin',
    ]);
    expect(consignees(dossier)).toEqual([
      {
        route: 'GET /essai/flux etat',
        corps: { ecranCourant: 3, revele: true },
      },
      { route: 'GET /essai/flux fin', corps: { motif: 'close' } },
    ]);
  });

  it('ne consigne rien sans dossier demandé', async () => {
    await fermerApplication(app);
    delete process.env[DOSSIER_DES_REPONSES_SERVIES];
    app = await monter();

    await request(httpServerOf(app)).get('/essai/cours/b2-03').expect(200);

    expect(existsSync(dossier)).toBe(false);
  });
});
