import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import {
  createLegacyUseCaseStubs,
  LEGACY_CONTROLLERS,
  legacyControllerProviders,
} from './factories/legacy-contract.factory';

import { WeatherController } from '../src/modules/weather/interfaces/Weather.controller';
import { GetGeocodingUseCase } from '../src/modules/weather/application/GetGeocoding.useCase';
import { GetForecastUseCase } from '../src/modules/weather/application/GetForecast.useCase';
import { GetAirQualityUseCase } from '../src/modules/weather/application/GetAirQuality.useCase';
import { GetEnsembleUseCase } from '../src/modules/weather/application/GetEnsemble.useCase';
import { GetHistoricalUseCase } from '../src/modules/weather/application/GetHistorical.useCase';
import { GetUserPreferencesUseCase } from '../src/modules/weather/application/GetUserPreferences.useCase';
import { UpdateUserPreferencesUseCase } from '../src/modules/weather/application/UpdateUserPreferences.useCase';
import { RecordUsageUseCase } from '../src/modules/weather/application/RecordUsage.useCase';
import { GetWeatherAlertsUseCase } from '../src/modules/weather/application/GetWeatherAlerts.useCase';
import { GetCurrentDetailedWeatherUseCase } from '../src/modules/weather/application/GetCurrentDetailedWeather.useCase';
import { GetForecastDetailedWeatherUseCase } from '../src/modules/weather/application/GetForecastDetailedWeather.useCase';
import { OPENWEATHERMAP_PROXY } from '../src/modules/weather/domain/token';

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

const stub = () => ({ execute: jest.fn() });

describe('OpenAPI legacy contract (phase 11)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: LEGACY_CONTROLLERS,
      providers: legacyControllerProviders(createLegacyUseCaseStubs()),
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps legacy path contracts stable', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Contract Test').setVersion('1.0').build(),
    );

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
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Contract Test').setVersion('1.0').build(),
    );
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
  let app: INestApplication;
  let document: ReturnType<typeof SwaggerModule.createDocument>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        WeatherController,
        UsersController,
        AuthController,
        ContactsController,
        CookieConsentsController,
        AuditsController,
      ],
      providers: [
        RolesGuard,

        { provide: GetGeocodingUseCase, useValue: stub() },
        { provide: GetForecastUseCase, useValue: stub() },
        { provide: GetAirQualityUseCase, useValue: stub() },
        { provide: GetEnsembleUseCase, useValue: stub() },
        { provide: GetHistoricalUseCase, useValue: stub() },
        { provide: GetUserPreferencesUseCase, useValue: stub() },
        { provide: UpdateUserPreferencesUseCase, useValue: stub() },
        { provide: RecordUsageUseCase, useValue: stub() },
        { provide: GetWeatherAlertsUseCase, useValue: stub() },
        { provide: GetCurrentDetailedWeatherUseCase, useValue: stub() },
        { provide: GetForecastDetailedWeatherUseCase, useValue: stub() },
        { provide: OPENWEATHERMAP_PROXY, useValue: {} },

        { provide: ListUsersUseCase, useValue: stub() },
        { provide: ListOneUserUseCase, useValue: stub() },
        { provide: UpdateUsersUseCase, useValue: stub() },
        { provide: DeleteUsersUseCase, useValue: stub() },

        ...authControllerProviders(createAuthUseCaseStubs()),
        ...coreControllerProviders(createCoreUseCaseStubs()),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Core Contract Test')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const pathsContaining = (segment: string) =>
    Object.fromEntries(
      Object.entries(document.paths).filter(([p]) => p.includes(`/${segment}`)),
    );

  it('keeps Weather path contracts stable', () => {
    expect(pathsContaining('weather')).toMatchSnapshot();
  });

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
