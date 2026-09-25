import type { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  DocumentBuilder,
  type SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';

import {
  createLegacyUseCaseStubs,
  LEGACY_CONTROLLERS,
  legacyControllerProviders,
} from './factories/legacy-contract.factory';

import { UsersController } from '../src/modules/users/interfaces/Users.controller';
import { ListUsersUseCase } from '../src/modules/users/application/ListUsers.useCase';
import { ListOneUserUseCase } from '../src/modules/users/application/ListOneUser.useCase';
import { UpdateUsersUseCase } from '../src/modules/users/application/UpdateUsers.useCase';
import { DeleteUsersUseCase } from '../src/modules/users/application/DeleteUsers.useCase';

import { AuthController } from '../src/modules/users/interfaces/Auth.controller';

import { ContactsController } from '../src/modules/contacts/interfaces/Contacts.controller';
import { CookieConsentsController } from '../src/modules/cookie-consents/interfaces/CookieConsents.controller';
import { AuditsController } from '../src/modules/audit-requests/interfaces/Audits.controller';

import {
  authControllerProviders,
  coreControllerProviders,
  createAuthUseCaseStubs,
  createCoreUseCaseStubs,
} from './factories/core-api.factory';

import { RolesGuard } from '../src/common/interfaces/auth/roles.guard';

import { ControlSessionRequestDto } from '../src/modules/formations/interfaces/dto/contrat/control-session.request.dto';
import { DeclarerJalonRequestDto } from '../src/modules/formations/interfaces/dto/contrat/declarer-jalon.request.dto';
import { DerouleResponseDto } from '../src/modules/formations/interfaces/dto/contrat/deroule.response.dto';
import { EtatParticipantResponseDto } from '../src/modules/formations/interfaces/dto/contrat/etat-participant.response.dto';
import { OpenSessionRequestDto } from '../src/modules/formations/interfaces/dto/contrat/open-session.request.dto';
import { RappelsResponseDto } from '../src/modules/formations/interfaces/dto/contrat/rappels.response.dto';
import { SessionResultsResponseDto } from '../src/modules/formations/interfaces/dto/contrat/session-results.response.dto';
import { StrategiesDefiResponseDto } from '../src/modules/formations/interfaces/dto/contrat/strategies-defi.response.dto';
import { SubmitDefiRequestDto } from '../src/modules/formations/interfaces/dto/contrat/submit-defi.request.dto';
import { SubmitProductionRequestDto } from '../src/modules/formations/interfaces/dto/contrat/submit-production.request.dto';
import {
  CoursPublicCatalogueResponseDto,
  SujetResponseDto,
} from '../src/modules/formations/interfaces/dto/contrat/sujet.response.dto';
import { SyntheseRappelsResponseDto } from '../src/modules/formations/interfaces/dto/contrat/synthese-rappels.response.dto';
import { TentativeEnigmeResponseDto } from '../src/modules/formations/interfaces/dto/contrat/tentative-enigme.response.dto';
import { TenterEnigmeRequestDto } from '../src/modules/formations/interfaces/dto/contrat/tenter-enigme.request.dto';
import { SubmitProductionResponseDto } from '../src/modules/formations/interfaces/dto/contrat/verdict-production.response.dto';
import { createMockDepotsFormations } from './factories/formation.factory';
import { monterApplicationFormations } from './helpers/formations-harness';
import { fermerApplication } from './helpers/nest-test-app';

const stub = () => ({ execute: jest.fn() });

const DTO_DU_CONTRAT = [
  SubmitProductionRequestDto,
  SubmitProductionResponseDto,
  TenterEnigmeRequestDto,
  TentativeEnigmeResponseDto,
  DeclarerJalonRequestDto,
  RappelsResponseDto,
  SubmitDefiRequestDto,
  StrategiesDefiResponseDto,
  EtatParticipantResponseDto,
  OpenSessionRequestDto,
  ControlSessionRequestDto,
  SujetResponseDto,
  DerouleResponseDto,
  SessionResultsResponseDto,
  SyntheseRappelsResponseDto,
  CoursPublicCatalogueResponseDto,
];

const ROUTES_ACTIVES_DU_CONTRAT = [
  '/sessions/{id}/productions',
  '/sessions/{id}/escape/{parcoursId}/tentatives',
  '/sessions/{id}/pulses/{sondageId}',
  '/sessions/{id}/defis/{defiId}/tentative',
  '/sessions/{id}/defis/{defiId}/strategies',
  '/sessions/{id}/moi',
  '/sessions/{id}/participants/{participantId}',
  '/sessions/{id}/rappels',
  '/sessions/{id}/rappels/synthese',
];

const ROUTES_A_VENIR_DU_CONTRAT: readonly string[] = [];

type DocumentOpenApi = ReturnType<typeof SwaggerModule.createDocument>;

async function documenterLeModule(
  metadonnees: ModuleMetadata,
  constructeur: DocumentBuilder,
  options?: SwaggerDocumentOptions,
): Promise<DocumentOpenApi> {
  const moduleRef = await Test.createTestingModule(metadonnees).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  await app.init();
  try {
    return SwaggerModule.createDocument(app, constructeur.build(), options);
  } finally {
    await app.close();
  }
}

describe('OpenAPI legacy contract (phase 11)', () => {
  let document: DocumentOpenApi;

  beforeAll(async () => {
    document = await documenterLeModule(
      {
        controllers: LEGACY_CONTROLLERS,
        providers: legacyControllerProviders(createLegacyUseCaseStubs()),
      },
      new DocumentBuilder().setTitle('Contract Test').setVersion('1.0'),
    );
  });

  it('keeps legacy path contracts stable', () => {
    const pathBySuffix = (suffix: string) => {
      const path = Object.keys(document.paths).find((candidate) =>
        candidate.endsWith(suffix),
      );
      if (!path) {
        throw new Error(`Missing OpenAPI path with suffix ${suffix}`);
      }
      return document.paths[path];
    };

    expect({
      services: pathBySuffix('/services'),
      projects: pathBySuffix('/projects'),
      courses: pathBySuffix('/courses'),
      redirects: pathBySuffix('/redirects'),
    }).toMatchSnapshot();
  });

  it('keeps legacy DTO schemas stable', () => {
    const schemas = document.components?.schemas ?? {};

    expect({
      ServiceResponseDto: schemas.ServiceResponseDto,
      ServiceListResponseDto: schemas.ServiceListResponseDto,
      ServiceRequestDto: schemas.ServiceRequestDto,
      ProjectRequestDto: schemas.ProjectRequestDto,
      ProjectResponseDto: schemas.ProjectResponseDto,
      ProjectListResponseDto: schemas.ProjectListResponseDto,
      CourseRequestDto: schemas.CourseRequestDto,
      CourseResponseDto: schemas.CourseResponseDto,
      CourseListResponseDto: schemas.CourseListResponseDto,
      RedirectRequestDto: schemas.RedirectRequestDto,
      RedirectResponseDto: schemas.RedirectResponseDto,
      RedirectListResponseDto: schemas.RedirectListResponseDto,
      PaginationMetaResponseDto: schemas.PaginationMetaResponseDto,
    }).toMatchSnapshot();
  });
});

describe('OpenAPI core contract', () => {
  let document: DocumentOpenApi;

  beforeAll(async () => {
    document = await documenterLeModule(
      {
        controllers: [
          UsersController,
          AuthController,
          ContactsController,
          CookieConsentsController,
          AuditsController,
        ],
        providers: [
          RolesGuard,

          { provide: ListUsersUseCase, useValue: stub() },
          { provide: ListOneUserUseCase, useValue: stub() },
          { provide: UpdateUsersUseCase, useValue: stub() },
          { provide: DeleteUsersUseCase, useValue: stub() },

          ...authControllerProviders(createAuthUseCaseStubs()),
          ...coreControllerProviders(createCoreUseCaseStubs()),
        ],
      },
      new DocumentBuilder()
        .setTitle('Core Contract Test')
        .setVersion('1.0')
        .addBearerAuth(),
    );
  });

  const pathsContaining = (segment: string) =>
    Object.fromEntries(
      Object.entries(document.paths).filter(([p]) => p.includes(`/${segment}`)),
    );

  it('keeps Users path contracts stable', () => {
    expect(pathsContaining('users')).toMatchSnapshot();
  });

  it('keeps Auth path contracts stable', () => {
    expect(pathsContaining('auth')).toMatchSnapshot();
  });

  it('keeps Contacts path contracts stable', () => {
    expect(pathsContaining('contacts')).toMatchSnapshot();
  });

  it('keeps CookieConsents path contracts stable', () => {
    expect(pathsContaining('cookie-consents')).toMatchSnapshot();
  });

  it('keeps AuditRequests path contracts stable', () => {
    expect(pathsContaining('audits')).toMatchSnapshot();
  });
});

describe('OpenAPI contrat B2-01', () => {
  it('fige les schemas des DTO du § 9.5 sans exposer de chemin', async () => {
    const document = await documenterLeModule(
      {},
      new DocumentBuilder().setTitle('Contrat B2-01').setVersion('1.0'),
      { extraModels: DTO_DU_CONTRAT },
    );

    expect(document.paths).toEqual({});
    expect(document.components?.schemas).toMatchSnapshot();
  });

  it('branche les routes du § 9.5 deja livrees et aucune autre', async () => {
    const app = await monterApplicationFormations(createMockDepotsFormations());
    const chemins = Object.keys(
      SwaggerModule.createDocument(app, new DocumentBuilder().build()).paths,
    );
    await fermerApplication(app);
    const servie = (route: string): boolean =>
      chemins.some((chemin) => chemin.endsWith(route));

    expect(ROUTES_ACTIVES_DU_CONTRAT.filter((route) => !servie(route))).toEqual(
      [],
    );
    expect(ROUTES_A_VENIR_DU_CONTRAT.filter(servie)).toEqual([]);
    expect(servie('/sessions/{id}/sujet')).toBe(true);
  });
});
