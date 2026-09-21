import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { Test as RequeteTest } from 'supertest';
import { JwtAuthGuard } from '../src/common/interfaces/auth/jwt-auth.guard';
import { AllExceptionsFilter } from '../src/common/interfaces/filters/all-exceptions.filter';
import { DomainExceptionFilter } from '../src/common/interfaces/filters/DomainExceptionFilter';
import { JwtTokenService } from '../src/modules/users/application/services/JwtTokenService';
import type { JwtPayload } from '../src/modules/users/application/services/JwtPayload';
import { USERS_REPOSITORY } from '../src/modules/users/domain/token';
import { EN_TETE_JETON } from '../src/modules/formations/interfaces/ParticipantToken.service';
import {
  buildCoursDeTest,
  creerCatalogueDeTest,
} from './factories/cours.factory';
import { createMockDepotsFormations } from './factories/formation.factory';
import {
  CONTROLEURS_FORMATIONS,
  fournisseursFormations,
  PREFIXE_API,
} from './helpers/formations-harness';
import { fermerApplication } from './helpers/nest-test-app';
import { GLOBAL_VALIDATION_PIPE_OPTIONS } from './helpers/validation-pipe';

const COURS = buildCoursDeTest({ slug: 'cours-gardes-formateur' });
const SESSION_ID = 'c3333333-3333-4333-8333-333333333333';
const PARTICIPANT_ID = 'e5555555-5555-4555-8555-555555555555';
const FORMATEUR_ID = 'a1111111-1111-4111-8111-111111111111';
const JETON_FORMATEUR = 'jeton-formateur';
const JETON_ETUDIANT_SANS_ROLE = 'jeton-sans-role';
const NON_AUTORISE = 401;
const INTERDIT = 403;
const REFUS_DE_ROLE = 'Insufficient permissions';

interface RouteFormateur {
  readonly methode: 'get' | 'post' | 'patch';
  readonly chemin: string;
}

const ROUTES_FORMATEUR: readonly RouteFormateur[] = [
  { methode: 'post', chemin: 'sessions' },
  { methode: 'post', chemin: `sessions/${SESSION_ID}/start` },
  { methode: 'patch', chemin: `sessions/${SESSION_ID}/control` },
  { methode: 'post', chemin: `sessions/${SESSION_ID}/close` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/results` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/report` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/deroule` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/free-responses` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/groups` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/participants` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/annotations` },
];

function payload(roles: readonly string[]): JwtPayload {
  return {
    sub: FORMATEUR_ID,
    email: 'formateur@example.test',
    iat: 0,
    exp: 0,
    iss: 'portfolio-2025',
    aud: 'portfolio-2025-api',
    roles: [...roles],
  };
}

describe('Gardes reelles des routes formateur (e2e http socket)', () => {
  let app: INestApplication;

  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  const appel = (route: RouteFormateur): RequeteTest =>
    request(serveur())[route.methode](
      `/${PREFIXE_API}/formations/${route.chemin}`,
    );

  beforeAll(async () => {
    const jwt = {
      verify: jest.fn((jeton: string) => {
        if (jeton === JETON_FORMATEUR) {
          return Promise.resolve(payload(['teacher']));
        }
        if (jeton === JETON_ETUDIANT_SANS_ROLE) {
          return Promise.resolve(payload([]));
        }
        return Promise.reject(new Error('jeton inconnu'));
      }),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }])],
      controllers: CONTROLEURS_FORMATIONS,
      providers: [
        ...fournisseursFormations(
          createMockDepotsFormations(),
          creerCatalogueDeTest(COURS),
        ),
        { provide: JwtTokenService, useValue: jwt },
        {
          provide: USERS_REPOSITORY,
          useValue: {
            findById: jest
              .fn()
              .mockResolvedValue({ id: FORMATEUR_ID, emailVerified: true }),
          },
        },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(PREFIXE_API);
    app.useGlobalFilters(
      new AllExceptionsFilter(),
      new DomainExceptionFilter(),
    );
    app.useGlobalPipes(new ValidationPipe(GLOBAL_VALIDATION_PIPE_OPTIONS));
    await app.init();
  });

  afterAll(async () => {
    await fermerApplication(app);
  });

  it.each(ROUTES_FORMATEUR)(
    'refuse en 401 $methode $chemin sans en-tete Authorization',
    async (route) => {
      const reponse = await appel(route);

      expect(reponse.status).toBe(NON_AUTORISE);
    },
  );

  it.each(ROUTES_FORMATEUR)(
    'refuse en 401 $methode $chemin avec un jeton invalide',
    async (route) => {
      const reponse = await appel(route).set(
        'Authorization',
        'Bearer jeton-forge',
      );

      expect(reponse.status).toBe(NON_AUTORISE);
    },
  );

  it.each(ROUTES_FORMATEUR)(
    'refuse en 403 $methode $chemin a un compte sans role formateur',
    async (route) => {
      const reponse = await appel(route).set(
        'Authorization',
        `Bearer ${JETON_ETUDIANT_SANS_ROLE}`,
      );

      expect(reponse.status).toBe(INTERDIT);
    },
  );

  it.each(ROUTES_FORMATEUR)(
    'laisse passer la garde de role pour $methode $chemin avec le role formateur',
    async (route) => {
      const reponse = await appel(route).set(
        'Authorization',
        `Bearer ${JETON_FORMATEUR}`,
      );

      expect(reponse.status).not.toBe(NON_AUTORISE);
      expect((reponse.body as { detail?: string }).detail).not.toBe(
        REFUS_DE_ROLE,
      );
    },
  );

  it('laisse les routes etudiantes publiques hors de la garde de jeton applicatif', async () => {
    const reponse = await request(serveur())
      .post(`/${PREFIXE_API}/formations/sessions/${SESSION_ID}/answers`)
      .set(EN_TETE_JETON, 'jeton-de-participant-invalide')
      .send({ questionId: 'Q-TEST-NUM', valeur: 1, dureeMs: 10 });

    expect(reponse.status).toBe(NON_AUTORISE);
    expect((reponse.body as { detail?: string }).detail).toContain(
      'participant',
    );
  });

  it('ne laisse pas un participant emprunter une route formateur', async () => {
    const reponse = await request(serveur())
      .get(`/${PREFIXE_API}/formations/sessions/${SESSION_ID}/results`)
      .set(EN_TETE_JETON, `${PARTICIPANT_ID}.empreinte`);

    expect(reponse.status).toBe(NON_AUTORISE);
  });
});
