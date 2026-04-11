/* eslint-disable @typescript-eslint/no-unsafe-argument -- res.body de Supertest est type any */
import {
  type ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
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
import { DeleteBudgetEntryUseCase } from '../src/modules/budget/application/services/DeleteBudgetEntry.useCase';
import { UpdateBudgetCategoryUseCase } from '../src/modules/budget/application/services/UpdateBudgetCategory.useCase';
import { WeatherController } from '../src/modules/weather/interfaces/Weather.controller';
import { GetGeocodingUseCase } from '../src/modules/weather/application/GetGeocoding.useCase';
import { GetForecastUseCase } from '../src/modules/weather/application/GetForecast.useCase';
import { GetAirQualityUseCase } from '../src/modules/weather/application/GetAirQuality.useCase';
import { GetEnsembleUseCase } from '../src/modules/weather/application/GetEnsemble.useCase';
import { GetHistoricalUseCase } from '../src/modules/weather/application/GetHistorical.useCase';
import { GetWeatherAlertsUseCase } from '../src/modules/weather/application/GetWeatherAlerts.useCase';
import { GetCurrentDetailedWeatherUseCase } from '../src/modules/weather/application/GetCurrentDetailedWeather.useCase';
import { GetForecastDetailedWeatherUseCase } from '../src/modules/weather/application/GetForecastDetailedWeather.useCase';
import { GetUserPreferencesUseCase } from '../src/modules/weather/application/GetUserPreferences.useCase';
import { UpdateUserPreferencesUseCase } from '../src/modules/weather/application/UpdateUserPreferences.useCase';
import { RecordUsageUseCase } from '../src/modules/weather/application/RecordUsage.useCase';
import { OPENWEATHERMAP_PROXY } from '../src/modules/weather/domain/token';
import { RolesGuard } from '../src/common/interfaces/auth/roles.guard';
import {
  buildBudgetGroup,
  buildBudgetEntry,
  buildBudgetCategory,
} from './factories/budget.factory';
import {
  buildWeatherPreferences,
  buildForecastResult,
  buildAirQualityResult,
  buildEnsembleResult,
  buildHistoricalResult,
  buildDetailedCurrentWeather,
  buildDetailedForecastResult,
} from './factories/weather.factory';

describe('Budget & Weather — contrat HTTP (e2e)', () => {
  let app: INestApplication;

  /* ---------- Mocks Budget ---------- */
  const createBudgetGroupUseCase = { execute: jest.fn() };
  const getBudgetGroupsUseCase = { execute: jest.fn() };
  const createBudgetEntryUseCase = { execute: jest.fn() };
  const getBudgetEntriesUseCase = { execute: jest.fn() };
  const getBudgetSummaryUseCase = { execute: jest.fn() };
  const importBudgetEntriesUseCase = { execute: jest.fn() };
  const updateBudgetEntryUseCase = { execute: jest.fn() };
  const createBudgetCategoryUseCase = { execute: jest.fn() };
  const getBudgetCategoriesUseCase = { execute: jest.fn() };
  const shareBudgetUseCase = { execute: jest.fn() };
  const deleteBudgetEntryUseCase = { execute: jest.fn() };
  const updateBudgetCategoryUseCase = { execute: jest.fn() };

  /* ---------- Mocks Weather ---------- */
  const getGeocodingUseCase = { execute: jest.fn() };
  const getForecastUseCase = { execute: jest.fn() };
  const getAirQualityUseCase = { execute: jest.fn() };
  const getEnsembleUseCase = { execute: jest.fn() };
  const getHistoricalUseCase = { execute: jest.fn() };
  const getUserPreferencesUseCase = { execute: jest.fn() };
  const updateUserPreferencesUseCase = { execute: jest.fn() };
  const recordUsageUseCase = { execute: jest.fn() };
  const getWeatherAlertsUseCase = { execute: jest.fn() };
  const getCurrentDetailedWeatherUseCase = { execute: jest.fn() };
  const getForecastDetailedWeatherUseCase = { execute: jest.fn() };
  const owmProxy = {
    getCurrentDetailed: jest.fn(),
    getForecastDetailed: jest.fn(),
  };

  const getHttpServer = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  /** Extrait les messages d'erreur de la reponse (format NestJS). */
  function extractMessages(body: Record<string, unknown>): string[] {
    const detail = (body.message ?? body.detail) as string | string[];
    return Array.isArray(detail) ? detail : [String(detail)];
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BudgetController, WeatherController],
      providers: [
        /* Budget */
        {
          provide: CreateBudgetGroupUseCase,
          useValue: createBudgetGroupUseCase,
        },
        { provide: GetBudgetGroupsUseCase, useValue: getBudgetGroupsUseCase },
        {
          provide: CreateBudgetEntryUseCase,
          useValue: createBudgetEntryUseCase,
        },
        { provide: GetBudgetEntriesUseCase, useValue: getBudgetEntriesUseCase },
        { provide: GetBudgetSummaryUseCase, useValue: getBudgetSummaryUseCase },
        {
          provide: ImportBudgetEntriesUseCase,
          useValue: importBudgetEntriesUseCase,
        },
        {
          provide: UpdateBudgetEntryUseCase,
          useValue: updateBudgetEntryUseCase,
        },
        {
          provide: CreateBudgetCategoryUseCase,
          useValue: createBudgetCategoryUseCase,
        },
        {
          provide: GetBudgetCategoriesUseCase,
          useValue: getBudgetCategoriesUseCase,
        },
        { provide: ShareBudgetUseCase, useValue: shareBudgetUseCase },
        {
          provide: DeleteBudgetEntryUseCase,
          useValue: deleteBudgetEntryUseCase,
        },
        {
          provide: UpdateBudgetCategoryUseCase,
          useValue: updateBudgetCategoryUseCase,
        },
        /* Weather */
        { provide: GetGeocodingUseCase, useValue: getGeocodingUseCase },
        { provide: GetForecastUseCase, useValue: getForecastUseCase },
        { provide: GetAirQualityUseCase, useValue: getAirQualityUseCase },
        { provide: GetEnsembleUseCase, useValue: getEnsembleUseCase },
        { provide: GetHistoricalUseCase, useValue: getHistoricalUseCase },
        {
          provide: GetUserPreferencesUseCase,
          useValue: getUserPreferencesUseCase,
        },
        {
          provide: UpdateUserPreferencesUseCase,
          useValue: updateUserPreferencesUseCase,
        },
        { provide: RecordUsageUseCase, useValue: recordUsageUseCase },
        { provide: GetWeatherAlertsUseCase, useValue: getWeatherAlertsUseCase },
        {
          provide: GetCurrentDetailedWeatherUseCase,
          useValue: getCurrentDetailedWeatherUseCase,
        },
        {
          provide: GetForecastDetailedWeatherUseCase,
          useValue: getForecastDetailedWeatherUseCase,
        },
        { provide: OPENWEATHERMAP_PROXY, useValue: owmProxy },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context
            .switchToHttp()
            .getRequest<Record<string, unknown>>();
          req.user = {
            sub: 'user-1',
            email: 'test@example.com',
            roles: ['budget', 'weather'],
          };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    /* --- Budget : valeurs par defaut des mocks --- */
    const group = buildBudgetGroup();
    createBudgetGroupUseCase.execute.mockResolvedValue(group);
    getBudgetGroupsUseCase.execute.mockResolvedValue([group]);

    const entry = buildBudgetEntry();
    createBudgetEntryUseCase.execute.mockResolvedValue(entry);
    getBudgetEntriesUseCase.execute.mockResolvedValue([entry]);
    updateBudgetEntryUseCase.execute.mockResolvedValue(entry);
    importBudgetEntriesUseCase.execute.mockResolvedValue([entry]);

    const category = buildBudgetCategory();
    createBudgetCategoryUseCase.execute.mockResolvedValue(category);
    getBudgetCategoriesUseCase.execute.mockResolvedValue([category]);

    getBudgetSummaryUseCase.execute.mockResolvedValue({
      totalExpenses: -85.5,
      totalIncoming: 2000,
      byCategory: [
        {
          categoryId: 'cat-1',
          categoryName: 'Courses',
          total: -85.5,
          budgetLimit: 600,
          remaining: 514.5,
        },
      ],
    });

    shareBudgetUseCase.execute.mockResolvedValue({
      message: 'Budget partage avec succes.',
    });

    /* --- Weather : valeurs par defaut des mocks --- */
    getGeocodingUseCase.execute.mockResolvedValue({
      results: [
        {
          id: 2988507,
          name: 'Paris',
          latitude: 48.8566,
          longitude: 2.3522,
          country: 'France',
          countryCode: 'FR',
          admin1: 'Ile-de-France',
        },
      ],
    });
    getForecastUseCase.execute.mockResolvedValue(buildForecastResult());
    getAirQualityUseCase.execute.mockResolvedValue(buildAirQualityResult());
    getEnsembleUseCase.execute.mockResolvedValue(buildEnsembleResult());
    getHistoricalUseCase.execute.mockResolvedValue(buildHistoricalResult());
    getUserPreferencesUseCase.execute.mockResolvedValue(
      buildWeatherPreferences(),
    );
    updateUserPreferencesUseCase.execute.mockResolvedValue(
      buildWeatherPreferences({ level: 'curious' }),
    );
    recordUsageUseCase.execute.mockResolvedValue(undefined);
    getCurrentDetailedWeatherUseCase.execute.mockResolvedValue(
      buildDetailedCurrentWeather(),
    );
    getForecastDetailedWeatherUseCase.execute.mockResolvedValue(
      buildDetailedForecastResult(),
    );
    owmProxy.getCurrentDetailed.mockResolvedValue(
      buildDetailedCurrentWeather(),
    );
    owmProxy.getForecastDetailed.mockResolvedValue(
      buildDetailedForecastResult(),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  /* =================================================================
   *  BUDGET — POST /api/budget/groups
   * ================================================================= */

  it('POST /api/budget/groups cree un groupe et retourne 201', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/groups')
      .send({ name: 'Budget couple T&M' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', 'Budget couple T&M');
    expect(res.body).toHaveProperty('ownerId');
    expect(res.body).toHaveProperty('createdAt');
  });

  it('POST /api/budget/groups rejette un payload vide (400)', async () => {
    await request(getHttpServer())
      .post('/api/budget/groups')
      .send({})
      .expect(400);
  });

  it('POST /api/budget/groups rejette les champs non declares', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/groups')
      .send({ name: 'Valide', injected: 'interdit' })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) =>
        m.includes('property injected should not exist'),
      ),
    ).toBe(true);
  });

  /* =================================================================
   *  BUDGET — GET /api/budget/groups
   * ================================================================= */

  it('GET /api/budget/groups retourne un tableau de groupes', async () => {
    const res = await request(getHttpServer())
      .get('/api/budget/groups')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
  });

  /* =================================================================
   *  BUDGET — POST /api/budget/entries
   * ================================================================= */

  it('POST /api/budget/entries cree une entree et retourne 201', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/entries')
      .send({
        groupId: '00000000-0000-4000-a000-000000000001',
        date: '2026-03-15',
        description: 'Carrefour courses',
        amount: -85.5,
        type: 'VARIABLE',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('amount');
    expect(res.body).toHaveProperty('description');
  });

  it('POST /api/budget/entries rejette sans groupId (400)', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/entries')
      .send({
        date: '2026-03-15',
        description: 'test',
        amount: 10,
        type: 'VARIABLE',
      })
      .expect(400);

    expect(extractMessages(res.body).some((m) => m.includes('groupId'))).toBe(
      true,
    );
  });

  it('POST /api/budget/entries rejette un type invalide (400)', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/entries')
      .send({
        groupId: '00000000-0000-4000-a000-000000000001',
        date: '2026-03-15',
        description: 'test',
        amount: 10,
        type: 'INVALID',
      })
      .expect(400);

    expect(extractMessages(res.body).some((m) => m.includes('type'))).toBe(
      true,
    );
  });

  it('POST /api/budget/entries rejette les champs non declares', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/entries')
      .send({
        groupId: '00000000-0000-4000-a000-000000000001',
        date: '2026-03-15',
        description: 'test',
        amount: 10,
        type: 'VARIABLE',
        injected: 'interdit',
      })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) =>
        m.includes('property injected should not exist'),
      ),
    ).toBe(true);
  });

  /* =================================================================
   *  BUDGET — PATCH /api/budget/entries/:id
   * ================================================================= */

  it('PATCH /api/budget/entries/:id met a jour la categorie', async () => {
    const uuid = '00000000-0000-4000-a000-000000000001';
    const res = await request(getHttpServer())
      .patch(`/api/budget/entries/${uuid}`)
      .send({ categoryId: '00000000-0000-4000-a000-000000000002' })
      .expect(200);

    expect(res.body).toHaveProperty('id');
  });

  it('PATCH /api/budget/entries/:id rejette un UUID invalide (400)', async () => {
    await request(getHttpServer())
      .patch('/api/budget/entries/not-a-uuid')
      .send({ categoryId: '00000000-0000-4000-a000-000000000002' })
      .expect(400);
  });

  it('PATCH /api/budget/entries/:id rejette les champs non declares', async () => {
    const uuid = '00000000-0000-4000-a000-000000000001';
    const res = await request(getHttpServer())
      .patch(`/api/budget/entries/${uuid}`)
      .send({ injected: 'interdit' })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) =>
        m.includes('property injected should not exist'),
      ),
    ).toBe(true);
  });

  /* =================================================================
   *  BUDGET — GET /api/budget/entries
   * ================================================================= */

  it('GET /api/budget/entries retourne les entrees filtrees', async () => {
    const res = await request(getHttpServer())
      .get('/api/budget/entries?groupId=group-1&month=3&year=2026')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('amount');
  });

  /* =================================================================
   *  BUDGET — GET /api/budget/summary
   * ================================================================= */

  it('GET /api/budget/summary retourne le resume mensuel', async () => {
    const res = await request(getHttpServer())
      .get('/api/budget/summary?groupId=group-1&month=3&year=2026')
      .expect(200);

    expect(res.body).toHaveProperty('totalExpenses');
    expect(res.body).toHaveProperty('totalIncoming');
    expect(res.body).toHaveProperty('byCategory');
    expect(Array.isArray(res.body.byCategory)).toBe(true);
  });

  /* =================================================================
   *  BUDGET — POST /api/budget/entries/import
   * ================================================================= */

  it('POST /api/budget/entries/import importe un CSV', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/entries/import')
      .send({
        groupId: '00000000-0000-4000-a000-000000000001',
        csvContent: 'date,description,amount\n2026-03-15,Courses,-85.5',
      })
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/budget/entries/import rejette sans csvContent (400)', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/entries/import')
      .send({ groupId: '00000000-0000-4000-a000-000000000001' })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) => m.includes('csvContent')),
    ).toBe(true);
  });

  it('POST /api/budget/entries/import rejette les champs non declares', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/entries/import')
      .send({
        groupId: '00000000-0000-4000-a000-000000000001',
        csvContent: 'data',
        injected: 'interdit',
      })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) =>
        m.includes('property injected should not exist'),
      ),
    ).toBe(true);
  });

  /* =================================================================
   *  BUDGET — POST /api/budget/categories
   * ================================================================= */

  it('POST /api/budget/categories cree une categorie', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/categories')
      .send({
        groupId: '00000000-0000-4000-a000-000000000001',
        name: 'Courses',
        budgetType: 'VARIABLE',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', 'Courses');
    expect(res.body).toHaveProperty('budgetType', 'VARIABLE');
  });

  it('POST /api/budget/categories rejette sans name (400)', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/categories')
      .send({
        groupId: '00000000-0000-4000-a000-000000000001',
        budgetType: 'VARIABLE',
      })
      .expect(400);

    expect(extractMessages(res.body).some((m) => m.includes('name'))).toBe(
      true,
    );
  });

  it('POST /api/budget/categories rejette un budgetType invalide', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/categories')
      .send({
        groupId: '00000000-0000-4000-a000-000000000001',
        name: 'Test',
        budgetType: 'INVALID',
      })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) => m.includes('budgetType')),
    ).toBe(true);
  });

  it('POST /api/budget/categories rejette les champs non declares', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/categories')
      .send({
        groupId: '00000000-0000-4000-a000-000000000001',
        name: 'Courses',
        budgetType: 'VARIABLE',
        injected: 'interdit',
      })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) =>
        m.includes('property injected should not exist'),
      ),
    ).toBe(true);
  });

  /* =================================================================
   *  BUDGET — GET /api/budget/categories
   * ================================================================= */

  it('GET /api/budget/categories retourne la liste des categories', async () => {
    const res = await request(getHttpServer())
      .get('/api/budget/categories?groupId=group-1')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
  });

  /* =================================================================
   *  BUDGET — POST /api/budget/share
   * ================================================================= */

  it('POST /api/budget/share partage un budget', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/share')
      .send({
        groupId: '00000000-0000-4000-a000-000000000001',
        targetEmail: 'maria@example.com',
      })
      .expect(201);

    expect(res.body).toHaveProperty('message');
  });

  it('POST /api/budget/share rejette un email invalide (400)', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/share')
      .send({
        groupId: '00000000-0000-4000-a000-000000000001',
        targetEmail: 'pas-un-email',
      })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) => m.includes('targetEmail')),
    ).toBe(true);
  });

  it('POST /api/budget/share rejette les champs non declares', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/share')
      .send({
        groupId: '00000000-0000-4000-a000-000000000001',
        targetEmail: 'maria@example.com',
        injected: 'interdit',
      })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) =>
        m.includes('property injected should not exist'),
      ),
    ).toBe(true);
  });

  /* =================================================================
   *  WEATHER — GET /api/weather/geocoding
   * ================================================================= */

  it('GET /api/weather/geocoding retourne des resultats de recherche', async () => {
    const res = await request(getHttpServer())
      .get('/api/weather/geocoding?name=Paris')
      .expect(200);

    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results[0]).toHaveProperty('name', 'Paris');
  });

  it('GET /api/weather/geocoding rejette sans name (400)', async () => {
    const res = await request(getHttpServer())
      .get('/api/weather/geocoding')
      .expect(400);

    expect(extractMessages(res.body).some((m) => m.includes('name'))).toBe(
      true,
    );
  });

  /* =================================================================
   *  WEATHER — GET /api/weather/forecast
   * ================================================================= */

  it('GET /api/weather/forecast retourne les previsions', async () => {
    const res = await request(getHttpServer())
      .get('/api/weather/forecast?latitude=48.85&longitude=2.35')
      .expect(200);

    expect(res.body).toHaveProperty('current');
    expect(res.body).toHaveProperty('hourly');
    expect(res.body).toHaveProperty('daily');
  });

  it('GET /api/weather/forecast rejette sans latitude (400)', async () => {
    const res = await request(getHttpServer())
      .get('/api/weather/forecast?longitude=2.35')
      .expect(400);

    expect(extractMessages(res.body).some((m) => m.includes('latitude'))).toBe(
      true,
    );
  });

  it('GET /api/weather/forecast rejette une latitude hors bornes (400)', async () => {
    const res = await request(getHttpServer())
      .get('/api/weather/forecast?latitude=100&longitude=2.35')
      .expect(400);

    expect(extractMessages(res.body).some((m) => m.includes('latitude'))).toBe(
      true,
    );
  });

  /* =================================================================
   *  WEATHER — GET /api/weather/air-quality
   * ================================================================= */

  it('GET /api/weather/air-quality retourne la qualite de l air', async () => {
    const res = await request(getHttpServer())
      .get('/api/weather/air-quality?latitude=48.85&longitude=2.35')
      .expect(200);

    expect(res.body).toHaveProperty('current');
    expect(res.body.current).toHaveProperty('european_aqi');
  });

  it('GET /api/weather/air-quality rejette sans coordonnees (400)', async () => {
    await request(getHttpServer()).get('/api/weather/air-quality').expect(400);
  });

  /* =================================================================
   *  WEATHER — GET /api/weather/ensemble
   * ================================================================= */

  it('GET /api/weather/ensemble retourne les modeles ensemble', async () => {
    const res = await request(getHttpServer())
      .get('/api/weather/ensemble?latitude=48.85&longitude=2.35')
      .expect(200);

    expect(res.body).toHaveProperty('models');
    expect(Array.isArray(res.body.models)).toBe(true);
  });

  it('GET /api/weather/ensemble rejette sans coordonnees (400)', async () => {
    await request(getHttpServer()).get('/api/weather/ensemble').expect(400);
  });

  /* =================================================================
   *  WEATHER — GET /api/weather/historical
   * ================================================================= */

  it('GET /api/weather/historical retourne les donnees historiques', async () => {
    const res = await request(getHttpServer())
      .get(
        '/api/weather/historical?latitude=48.85&longitude=2.35&startDate=2025-01-01&endDate=2025-01-31',
      )
      .expect(200);

    expect(res.body).toHaveProperty('daily');
    expect(res.body.daily).toHaveProperty('time');
  });

  it('GET /api/weather/historical rejette sans startDate (400)', async () => {
    const res = await request(getHttpServer())
      .get(
        '/api/weather/historical?latitude=48.85&longitude=2.35&endDate=2025-01-31',
      )
      .expect(400);

    expect(extractMessages(res.body).some((m) => m.includes('startDate'))).toBe(
      true,
    );
  });

  /* =================================================================
   *  WEATHER — GET /api/weather/preferences
   * ================================================================= */

  it('GET /api/weather/preferences retourne les preferences', async () => {
    const res = await request(getHttpServer())
      .get('/api/weather/preferences')
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('level');
    expect(res.body).toHaveProperty('units');
  });

  /* =================================================================
   *  WEATHER — PATCH /api/weather/preferences
   * ================================================================= */

  it('PATCH /api/weather/preferences met a jour les preferences', async () => {
    const res = await request(getHttpServer())
      .patch('/api/weather/preferences')
      .send({ level: 'curious' })
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('level');
  });

  it('PATCH /api/weather/preferences rejette un level invalide (400)', async () => {
    const res = await request(getHttpServer())
      .patch('/api/weather/preferences')
      .send({ level: 'INVALID' })
      .expect(400);

    expect(extractMessages(res.body).some((m) => m.includes('level'))).toBe(
      true,
    );
  });

  it('PATCH /api/weather/preferences rejette les champs non declares', async () => {
    const res = await request(getHttpServer())
      .patch('/api/weather/preferences')
      .send({ injected: 'interdit' })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) =>
        m.includes('property injected should not exist'),
      ),
    ).toBe(true);
  });

  /* =================================================================
   *  WEATHER — POST /api/weather/preferences/record-usage
   * ================================================================= */

  it('POST /api/weather/preferences/record-usage enregistre une utilisation', async () => {
    await request(getHttpServer())
      .post('/api/weather/preferences/record-usage')
      .expect(201);
  });

  /* =================================================================
   *  WEATHER — GET /api/weather/current-detailed
   * ================================================================= */

  it('GET /api/weather/current-detailed retourne la meteo detaillee', async () => {
    const res = await request(getHttpServer())
      .get('/api/weather/current-detailed?latitude=48.85&longitude=2.35')
      .expect(200);

    expect(res.body).toHaveProperty('temperature');
    expect(res.body).toHaveProperty('humidity');
    expect(res.body).toHaveProperty('windSpeed');
  });

  it('GET /api/weather/current-detailed rejette sans coordonnees (400)', async () => {
    await request(getHttpServer())
      .get('/api/weather/current-detailed')
      .expect(400);
  });

  /* =================================================================
   *  WEATHER — GET /api/weather/forecast-detailed
   * ================================================================= */

  it('GET /api/weather/forecast-detailed retourne les previsions detaillees', async () => {
    const res = await request(getHttpServer())
      .get('/api/weather/forecast-detailed?latitude=48.85&longitude=2.35')
      .expect(200);

    expect(res.body).toHaveProperty('cityName');
    expect(res.body).toHaveProperty('hourly');
    expect(res.body).toHaveProperty('daily');
  });

  it('GET /api/weather/forecast-detailed rejette sans coordonnees (400)', async () => {
    await request(getHttpServer())
      .get('/api/weather/forecast-detailed')
      .expect(400);
  });
});
