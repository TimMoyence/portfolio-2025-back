import type { INestApplication } from '@nestjs/common';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { Test as RequeteTest } from 'supertest';
import { JwtAuthGuard } from '../src/common/interfaces/auth/jwt-auth.guard';
import { ROLES_KEY } from '../src/common/interfaces/auth/roles.decorator';
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
  serveurHttpDe,
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
  readonly methode: 'get' | 'post' | 'patch' | 'delete';
  readonly chemin: string;
}

const PARTICIPANT_DE_LA_SEANCE = `sessions/${SESSION_ID}/participants/${PARTICIPANT_ID}`;

const ROUTES_FORMATEUR: readonly RouteFormateur[] = [
  { methode: 'post', chemin: 'sessions' },
  { methode: 'post', chemin: `sessions/${SESSION_ID}/start` },
  { methode: 'patch', chemin: `sessions/${SESSION_ID}/control` },
  { methode: 'post', chemin: `sessions/${SESSION_ID}/close` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/presenter-stream` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/results` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/report` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/deroule` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/free-responses` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/rappels/synthese` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/participants` },
  { methode: 'delete', chemin: PARTICIPANT_DE_LA_SEANCE },
  { methode: 'post', chemin: `${PARTICIPANT_DE_LA_SEANCE}/readmission` },
  { methode: 'post', chemin: `${PARTICIPANT_DE_LA_SEANCE}/liberation` },
  { methode: 'get', chemin: `sessions/${SESSION_ID}/annotations` },
  { methode: 'post', chemin: `sessions/${SESSION_ID}/annotations` },
];

const EN_TETES_REFUSES = [
  {
    cas: 'avec un jeton invalide',
    enTete: 'Authorization',
    valeur: 'Bearer jeton-forge',
  },
  {
    cas: 'T1 · a un jeton formateur porte par cookie seul',
    enTete: 'Cookie',
    valeur: `access_token=${JETON_FORMATEUR}; Authorization=Bearer%20${JETON_FORMATEUR}`,
  },
  {
    cas: 'T1 · a un schema d autorisation autre que Bearer',
    enTete: 'Authorization',
    valeur: `Basic ${JETON_FORMATEUR}`,
  },
] as const;

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

  const serveur = () => serveurHttpDe(app);

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

  it.each(
    ROUTES_FORMATEUR.flatMap((route) =>
      EN_TETES_REFUSES.map((refus) => ({ ...route, ...refus })),
    ),
  )('refuse en 401 $methode $chemin $cas', async (cas) => {
    const reponse = await appel(cas).set(cas.enTete, cas.valeur);

    expect(reponse.status).toBe(NON_AUTORISE);
  });

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

  it('T1 · la matrice couvre chaque route des controleurs reserves au formateur', () => {
    const declarees = CONTROLEURS_FORMATIONS.filter(
      (controleur) => Reflect.getMetadata(ROLES_KEY, controleur) !== undefined,
    ).flatMap((controleur) => {
      const prototype: object = controleur.prototype;
      return Object.getOwnPropertyNames(prototype)
        .filter((nom) => nom !== 'constructor')
        .map(
          (nom): unknown =>
            Object.getOwnPropertyDescriptor(prototype, nom)?.value,
        )
        .filter(
          (handler): handler is object =>
            typeof handler === 'function' &&
            Reflect.getMetadata(PATH_METADATA, handler) !== undefined,
        )
        .map((handler) => {
          const methode =
            RequestMethod[
              Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod
            ].toLowerCase();
          const chemin = (Reflect.getMetadata(PATH_METADATA, handler) as string)
            .replace(':participantId', PARTICIPANT_ID)
            .replace(':id', SESSION_ID);
          return `${methode} ${chemin}`;
        });
    });
    const couvertes = ROUTES_FORMATEUR.map(
      (route) => `${route.methode} ${route.chemin}`,
    );

    const parOrdreAlphabetique = (a: string, b: string): number =>
      a.localeCompare(b);

    expect([...couvertes].sort(parOrdreAlphabetique)).toEqual(
      [...declarees].sort(parOrdreAlphabetique),
    );
  });

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
