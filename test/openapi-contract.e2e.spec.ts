import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/* ── Legacy modules ────────────────────────────────────────────────── */
import { CreateCoursesUseCase } from '../src/modules/courses/application/CreateCourses.useCase';
import { ListCoursesUseCase } from '../src/modules/courses/application/ListCourses.useCase';
import { CoursesController } from '../src/modules/courses/interfaces/Courses.controller';
import { CreateProjectsUseCase } from '../src/modules/projects/application/CreateProjects.useCase';
import { ListProjectsUseCase } from '../src/modules/projects/application/ListProjects.useCase';
import { ProjectsController } from '../src/modules/projects/interfaces/Projects.controller';
import { CreateRedirectsUseCase } from '../src/modules/redirects/application/CreateRedirects.useCase';
import { ListRedirectsUseCase } from '../src/modules/redirects/application/ListRedirects.useCase';
import { RedirectsController } from '../src/modules/redirects/interfaces/Redirects.controller';
import { CreateServicesUseCase } from '../src/modules/services/application/CreateServices.useCase';
import { ListServicesUseCase } from '../src/modules/services/application/ListServices.useCase';
import { ServicesController } from '../src/modules/services/interfaces/Services.controller';

/* ── Weather module ────────────────────────────────────────────────── */
import { WeatherController } from '../src/modules/weather/interfaces/Weather.controller';
import { GetGeocodingUseCase } from '../src/modules/weather/application/GetGeocoding.useCase';
import { GetForecastUseCase } from '../src/modules/weather/application/GetForecast.useCase';
import { GetAirQualityUseCase } from '../src/modules/weather/application/GetAirQuality.useCase';
import { GetEnsembleUseCase } from '../src/modules/weather/application/GetEnsemble.useCase';
import { GetHistoricalUseCase } from '../src/modules/weather/application/GetHistorical.useCase';
import { GetUserPreferencesUseCase } from '../src/modules/weather/application/GetUserPreferences.useCase';
import { UpdateUserPreferencesUseCase } from '../src/modules/weather/application/UpdateUserPreferences.useCase';
import { RecordUsageUseCase } from '../src/modules/weather/application/RecordUsage.useCase';
import { OPENWEATHERMAP_PROXY } from '../src/modules/weather/domain/token';

/* ── Budget module ─────────────────────────────────────────────────── */
import { BudgetController } from '../src/modules/budget/interfaces/Budget.controller';
import { CreateBudgetGroupUseCase } from '../src/modules/budget/application/services/CreateBudgetGroup.useCase';
import { GetBudgetGroupsUseCase } from '../src/modules/budget/application/services/GetBudgetGroups.useCase';
import { CreateBudgetEntryUseCase } from '../src/modules/budget/application/services/CreateBudgetEntry.useCase';
import { GetBudgetEntriesUseCase } from '../src/modules/budget/application/services/GetBudgetEntries.useCase';
import { GetBudgetSummaryUseCase } from '../src/modules/budget/application/services/GetBudgetSummary.useCase';
import { ImportBudgetEntriesUseCase } from '../src/modules/budget/application/services/ImportBudgetEntries.useCase';
import { UpdateBudgetEntryUseCase } from '../src/modules/budget/application/services/UpdateBudgetEntry.useCase';
import { CreateBudgetCategoryUseCase } from '../src/modules/budget/application/services/CreateBudgetCategory.useCase';
import { GetBudgetCategoriesUseCase } from '../src/modules/budget/application/services/GetBudgetCategories.useCase';
import { ShareBudgetUseCase } from '../src/modules/budget/application/services/ShareBudget.useCase';

/* ── Users module ──────────────────────────────────────────────────── */
import { UsersController } from '../src/modules/users/interfaces/Users.controller';
import { ListUsersUseCase } from '../src/modules/users/application/ListUsers.useCase';
import { ListOneUserUseCase } from '../src/modules/users/application/ListOneUser.useCase';
import { CreateUsersUseCase } from '../src/modules/users/application/CreateUsers.useCase';
import { UpdateUsersUseCase } from '../src/modules/users/application/UpdateUsers.useCase';
import { DeleteUsersUseCase } from '../src/modules/users/application/DeleteUsers.useCase';

/* ── Auth module ───────────────────────────────────────────────────── */
import { AuthController } from '../src/modules/users/interfaces/Auth.controller';
import { AuthenticateUserUseCase } from '../src/modules/users/application/AuthenticateUser.useCase';
import { AuthenticateGoogleUserUseCase } from '../src/modules/users/application/AuthenticateGoogleUser.useCase';
import { ChangePasswordUseCase } from '../src/modules/users/application/ChangePassword.useCase';
import { RefreshTokensUseCase } from '../src/modules/users/application/RefreshTokens.useCase';
import { RequestPasswordResetUseCase } from '../src/modules/users/application/RequestPasswordReset.useCase';
import { ResetPasswordUseCase } from '../src/modules/users/application/ResetPassword.useCase';
import { RevokeTokenUseCase } from '../src/modules/users/application/RevokeToken.useCase';
import { SetPasswordUseCase } from '../src/modules/users/application/SetPassword.useCase';
import { USERS_REPOSITORY } from '../src/modules/users/domain/token';

/* ── Contacts module ───────────────────────────────────────────────── */
import { ContactsController } from '../src/modules/contacts/interfaces/Contacts.controller';
import { CreateContactsUseCase } from '../src/modules/contacts/application/CreateContacts.useCase';

/* ── CookieConsents module ─────────────────────────────────────────── */
import { CookieConsentsController } from '../src/modules/cookie-consents/interfaces/CookieConsents.controller';
import { CreateCookieConsentsUseCase } from '../src/modules/cookie-consents/application/CreateCookieConsents.useCase';

/* ── AuditRequests module ──────────────────────────────────────────── */
import { AuditsController } from '../src/modules/audit-requests/interfaces/Audits.controller';
import { CreateAuditRequestsUseCase } from '../src/modules/audit-requests/application/CreateAuditRequests.useCase';
import { GetAuditSummaryUseCase } from '../src/modules/audit-requests/application/GetAuditSummary.useCase';
import { StreamAuditEventsUseCase } from '../src/modules/audit-requests/application/StreamAuditEvents.useCase';

/* ── Guard ─────────────────────────────────────────────────────────── */
import { RolesGuard } from '../src/common/interfaces/auth/roles.guard';

/** Stub factory : { execute: jest.fn() } */
const stub = () => ({ execute: jest.fn() });

describe('OpenAPI legacy contract (phase 11)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        ServicesController,
        ProjectsController,
        CoursesController,
        RedirectsController,
      ],
      providers: [
        { provide: ListServicesUseCase, useValue: stub() },
        { provide: CreateServicesUseCase, useValue: stub() },
        { provide: ListProjectsUseCase, useValue: stub() },
        { provide: CreateProjectsUseCase, useValue: stub() },
        { provide: ListCoursesUseCase, useValue: stub() },
        { provide: CreateCoursesUseCase, useValue: stub() },
        { provide: ListRedirectsUseCase, useValue: stub() },
        { provide: CreateRedirectsUseCase, useValue: stub() },
      ],
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

/* ================================================================== */
/*  Core modules — contrats OpenAPI                                    */
/* ================================================================== */

describe('OpenAPI core contract', () => {
  let app: INestApplication;
  let document: ReturnType<typeof SwaggerModule.createDocument>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        WeatherController,
        BudgetController,
        UsersController,
        AuthController,
        ContactsController,
        CookieConsentsController,
        AuditsController,
      ],
      providers: [
        /* ── Guards ─────────────────────────────────────── */
        RolesGuard,

        /* ── Weather ────────────────────────────────────── */
        { provide: GetGeocodingUseCase, useValue: stub() },
        { provide: GetForecastUseCase, useValue: stub() },
        { provide: GetAirQualityUseCase, useValue: stub() },
        { provide: GetEnsembleUseCase, useValue: stub() },
        { provide: GetHistoricalUseCase, useValue: stub() },
        { provide: GetUserPreferencesUseCase, useValue: stub() },
        { provide: UpdateUserPreferencesUseCase, useValue: stub() },
        { provide: RecordUsageUseCase, useValue: stub() },
        { provide: OPENWEATHERMAP_PROXY, useValue: {} },

        /* ── Budget ─────────────────────────────────────── */
        { provide: CreateBudgetGroupUseCase, useValue: stub() },
        { provide: GetBudgetGroupsUseCase, useValue: stub() },
        { provide: CreateBudgetEntryUseCase, useValue: stub() },
        { provide: GetBudgetEntriesUseCase, useValue: stub() },
        { provide: GetBudgetSummaryUseCase, useValue: stub() },
        { provide: ImportBudgetEntriesUseCase, useValue: stub() },
        { provide: UpdateBudgetEntryUseCase, useValue: stub() },
        { provide: CreateBudgetCategoryUseCase, useValue: stub() },
        { provide: GetBudgetCategoriesUseCase, useValue: stub() },
        { provide: ShareBudgetUseCase, useValue: stub() },

        /* ── Users ──────────────────────────────────────── */
        { provide: ListUsersUseCase, useValue: stub() },
        { provide: ListOneUserUseCase, useValue: stub() },
        { provide: CreateUsersUseCase, useValue: stub() },
        { provide: UpdateUsersUseCase, useValue: stub() },
        { provide: DeleteUsersUseCase, useValue: stub() },

        /* ── Auth ───────────────────────────────────────── */
        { provide: AuthenticateUserUseCase, useValue: stub() },
        { provide: AuthenticateGoogleUserUseCase, useValue: stub() },
        { provide: ChangePasswordUseCase, useValue: stub() },
        { provide: RefreshTokensUseCase, useValue: stub() },
        { provide: RevokeTokenUseCase, useValue: stub() },
        { provide: RequestPasswordResetUseCase, useValue: stub() },
        { provide: ResetPasswordUseCase, useValue: stub() },
        { provide: SetPasswordUseCase, useValue: stub() },
        { provide: USERS_REPOSITORY, useValue: {} },

        /* ── Contacts ───────────────────────────────────── */
        { provide: CreateContactsUseCase, useValue: stub() },

        /* ── CookieConsents ─────────────────────────────── */
        { provide: CreateCookieConsentsUseCase, useValue: stub() },

        /* ── AuditRequests ──────────────────────────────── */
        { provide: CreateAuditRequestsUseCase, useValue: stub() },
        { provide: GetAuditSummaryUseCase, useValue: stub() },
        { provide: StreamAuditEventsUseCase, useValue: stub() },
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

  /** Retourne toutes les entrees OpenAPI dont le path contient le segment donne. */
  const pathsContaining = (segment: string) =>
    Object.fromEntries(
      Object.entries(document.paths).filter(([p]) => p.includes(`/${segment}`)),
    );

  it('keeps Weather path contracts stable', () => {
    expect(pathsContaining('weather')).toMatchSnapshot();
  });

  it('keeps Budget path contracts stable', () => {
    expect(pathsContaining('budget')).toMatchSnapshot();
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
