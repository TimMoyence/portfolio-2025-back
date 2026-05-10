/* eslint-disable @typescript-eslint/no-unsafe-argument -- res.body de Supertest est type any */
import {
  type ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { BudgetController } from '../src/modules/budget/interfaces/Budget.controller';
import { BudgetContributionsController } from '../src/modules/budget/interfaces/BudgetContributions.controller';
import { BudgetGoalsController } from '../src/modules/budget/interfaces/BudgetGoals.controller';
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
import { GetBudgetGroupMembersUseCase } from '../src/modules/budget/application/services/GetBudgetGroupMembers.useCase';
import { RemoveBudgetGroupMemberUseCase } from '../src/modules/budget/application/services/RemoveBudgetGroupMember.useCase';
import { GetBudgetEntriesMonthsUseCase } from '../src/modules/budget/application/services/GetBudgetEntriesMonths.useCase';
import { ListPendingInvitationsUseCase } from '../src/modules/budget/application/services/ListPendingInvitations.useCase';
import { GetBudgetContributionsUseCase } from '../src/modules/budget/application/services/GetBudgetContributions.useCase';
import { UpsertMyBudgetContributionUseCase } from '../src/modules/budget/application/services/UpsertMyBudgetContribution.useCase';
import { CreateBudgetGoalUseCase } from '../src/modules/budget/application/services/CreateBudgetGoal.useCase';
import { GetBudgetGoalsWithProgressUseCase } from '../src/modules/budget/application/services/GetBudgetGoalsWithProgress.useCase';
import { UpdateBudgetGoalUseCase } from '../src/modules/budget/application/services/UpdateBudgetGoal.useCase';
import { DeleteBudgetGoalUseCase } from '../src/modules/budget/application/services/DeleteBudgetGoal.useCase';
import { RolesGuard } from '../src/common/interfaces/auth/roles.guard';
import { DomainExceptionFilter } from '../src/common/interfaces/filters/DomainExceptionFilter';
import { InsufficientPermissionsError } from '../src/common/domain/errors/InsufficientPermissionsError';
import { InvalidInputError } from '../src/common/domain/errors/InvalidInputError';
import {
  buildBudgetGroup,
  buildBudgetEntry,
  buildBudgetCategory,
  buildBudgetMember,
  buildBudgetMemberContribution,
  buildBudgetGoal,
  buildBudgetGoalWithProgress,
} from './factories/budget.factory';

/**
 * Tests e2e HTTP du module Budget — endpoints multi-membres :
 * contributions, goals, membres de groupe et mois disponibles.
 *
 * Pattern : vrais controllers NestJS + use cases mockes (aucune DB).
 */
describe('Budget multi-membres — contrat HTTP (e2e)', () => {
  let app: INestApplication;

  /* ---------- Mocks BudgetController ---------- */
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
  const getBudgetGroupMembersUseCase = { execute: jest.fn() };
  const removeBudgetGroupMemberUseCase = { execute: jest.fn() };
  const getBudgetEntriesMonthsUseCase = { execute: jest.fn() };
  const listPendingInvitationsUseCase = { execute: jest.fn() };

  /* ---------- Mocks BudgetContributionsController ---------- */
  const getBudgetContributionsUseCase = { execute: jest.fn() };
  const upsertMyBudgetContributionUseCase = { execute: jest.fn() };

  /* ---------- Mocks BudgetGoalsController ---------- */
  const createBudgetGoalUseCase = { execute: jest.fn() };
  const getBudgetGoalsWithProgressUseCase = { execute: jest.fn() };
  const updateBudgetGoalUseCase = { execute: jest.fn() };
  const deleteBudgetGoalUseCase = { execute: jest.fn() };

  const getHttpServer = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  /** Extrait les messages d'erreur de la reponse (format NestJS). */
  function extractMessages(body: Record<string, unknown>): string[] {
    const detail = (body.message ?? body.detail) as string | string[];
    return Array.isArray(detail) ? detail : [String(detail)];
  }

  const GROUP_UUID = '00000000-0000-4000-a000-000000000001';
  const MEMBER_UUID = '00000000-0000-4000-a000-000000000002';
  const GOAL_UUID = '00000000-0000-4000-a000-000000000003';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        BudgetController,
        BudgetContributionsController,
        BudgetGoalsController,
      ],
      providers: [
        /* BudgetController */
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
        {
          provide: GetBudgetGroupMembersUseCase,
          useValue: getBudgetGroupMembersUseCase,
        },
        {
          provide: RemoveBudgetGroupMemberUseCase,
          useValue: removeBudgetGroupMemberUseCase,
        },
        {
          provide: GetBudgetEntriesMonthsUseCase,
          useValue: getBudgetEntriesMonthsUseCase,
        },
        {
          provide: ListPendingInvitationsUseCase,
          useValue: listPendingInvitationsUseCase,
        },
        /* BudgetContributionsController */
        {
          provide: GetBudgetContributionsUseCase,
          useValue: getBudgetContributionsUseCase,
        },
        {
          provide: UpsertMyBudgetContributionUseCase,
          useValue: upsertMyBudgetContributionUseCase,
        },
        /* BudgetGoalsController */
        { provide: CreateBudgetGoalUseCase, useValue: createBudgetGoalUseCase },
        {
          provide: GetBudgetGoalsWithProgressUseCase,
          useValue: getBudgetGoalsWithProgressUseCase,
        },
        { provide: UpdateBudgetGoalUseCase, useValue: updateBudgetGoalUseCase },
        { provide: DeleteBudgetGoalUseCase, useValue: deleteBudgetGoalUseCase },
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
            roles: ['budget'],
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
    app.useGlobalFilters(new DomainExceptionFilter());
    app.setGlobalPrefix('api');
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    /* BudgetController — mocks par defaut */
    createBudgetGroupUseCase.execute.mockResolvedValue(buildBudgetGroup());
    getBudgetGroupsUseCase.execute.mockResolvedValue([buildBudgetGroup()]);
    createBudgetEntryUseCase.execute.mockResolvedValue(buildBudgetEntry());
    getBudgetEntriesUseCase.execute.mockResolvedValue([buildBudgetEntry()]);
    updateBudgetEntryUseCase.execute.mockResolvedValue(buildBudgetEntry());
    importBudgetEntriesUseCase.execute.mockResolvedValue([buildBudgetEntry()]);
    createBudgetCategoryUseCase.execute.mockResolvedValue(
      buildBudgetCategory(),
    );
    getBudgetCategoriesUseCase.execute.mockResolvedValue([
      buildBudgetCategory(),
    ]);
    getBudgetSummaryUseCase.execute.mockResolvedValue({
      totalExpenses: -500,
      totalIncoming: 2000,
      byCategory: [],
    });
    shareBudgetUseCase.execute.mockResolvedValue({
      message: 'Budget partage avec succes.',
    });

    /* membres */
    const owner = buildBudgetMember({
      userId: 'user-1',
      email: 'owner@example.com',
      displayName: 'Owner',
      isOwner: true,
    });
    const invited = buildBudgetMember({
      userId: MEMBER_UUID,
      email: 'invited@example.com',
      displayName: 'Invite',
      isOwner: false,
    });
    getBudgetGroupMembersUseCase.execute.mockResolvedValue([owner, invited]);
    removeBudgetGroupMemberUseCase.execute.mockResolvedValue(undefined);
    getBudgetEntriesMonthsUseCase.execute.mockResolvedValue([
      { month: 3, year: 2026 },
      { month: 4, year: 2026 },
    ]);

    /* contributions */
    const contrib1 = buildBudgetMemberContribution({
      id: 'contrib-1',
      userId: 'user-1',
      monthlySalary: 2500,
    });
    const contrib2 = buildBudgetMemberContribution({
      id: 'contrib-2',
      userId: MEMBER_UUID,
      monthlySalary: 3200,
    });
    getBudgetContributionsUseCase.execute.mockResolvedValue([
      contrib1,
      contrib2,
    ]);
    upsertMyBudgetContributionUseCase.execute.mockResolvedValue(contrib1);

    /* goals */
    const goalWithProgress = buildBudgetGoalWithProgress({
      id: GOAL_UUID,
      name: 'Vacances',
      kind: 'SAVINGS',
      targetAmount: 1000,
      currentAmount: 250,
      progressPercent: 25,
    });
    const goal = buildBudgetGoal({ id: GOAL_UUID, name: 'Vacances' });
    createBudgetGoalUseCase.execute.mockResolvedValue(goal);
    getBudgetGoalsWithProgressUseCase.execute.mockResolvedValue([
      goalWithProgress,
    ]);
    updateBudgetGoalUseCase.execute.mockResolvedValue(goal);
    deleteBudgetGoalUseCase.execute.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app.close();
  });

  /* =================================================================
   *  PUT /api/budget/contributions — upsert salaire
   * ================================================================= */

  it('PUT /api/budget/contributions retourne 200 avec payload valide', async () => {
    const res = await request(getHttpServer())
      .put('/api/budget/contributions')
      .send({ groupId: GROUP_UUID, month: 5, year: 2026, monthlySalary: 2500 })
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('groupId');
    expect(res.body).toHaveProperty('userId');
    expect(res.body).toHaveProperty('monthlySalary', 2500);
  });

  it('PUT /api/budget/contributions appelle le use case avec userId du JWT', async () => {
    await request(getHttpServer())
      .put('/api/budget/contributions')
      .send({ groupId: GROUP_UUID, month: 5, year: 2026, monthlySalary: 2500 })
      .expect(200);

    expect(upsertMyBudgetContributionUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        groupId: GROUP_UUID,
        month: 5,
        year: 2026,
        monthlySalary: 2500,
      }),
    );
  });

  it('PUT /api/budget/contributions rejette sans groupId (400)', async () => {
    const res = await request(getHttpServer())
      .put('/api/budget/contributions')
      .send({ month: 5, year: 2026, monthlySalary: 2500 })
      .expect(400);

    expect(extractMessages(res.body).some((m) => m.includes('groupId'))).toBe(
      true,
    );
  });

  it('PUT /api/budget/contributions rejette sans month (400)', async () => {
    const res = await request(getHttpServer())
      .put('/api/budget/contributions')
      .send({ groupId: GROUP_UUID, year: 2026, monthlySalary: 2500 })
      .expect(400);

    expect(extractMessages(res.body).some((m) => m.includes('month'))).toBe(
      true,
    );
  });

  it('PUT /api/budget/contributions rejette sans year (400)', async () => {
    const res = await request(getHttpServer())
      .put('/api/budget/contributions')
      .send({ groupId: GROUP_UUID, month: 5, monthlySalary: 2500 })
      .expect(400);

    expect(extractMessages(res.body).some((m) => m.includes('year'))).toBe(
      true,
    );
  });

  it('PUT /api/budget/contributions rejette sans monthlySalary (400)', async () => {
    const res = await request(getHttpServer())
      .put('/api/budget/contributions')
      .send({ groupId: GROUP_UUID, month: 5, year: 2026 })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) => m.includes('monthlySalary')),
    ).toBe(true);
  });

  it('PUT /api/budget/contributions rejette monthlySalary negatif (400)', async () => {
    const res = await request(getHttpServer())
      .put('/api/budget/contributions')
      .send({ groupId: GROUP_UUID, month: 5, year: 2026, monthlySalary: -1 })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) => m.includes('monthlySalary')),
    ).toBe(true);
  });

  it('PUT /api/budget/contributions rejette les champs non declares', async () => {
    const res = await request(getHttpServer())
      .put('/api/budget/contributions')
      .send({
        groupId: GROUP_UUID,
        month: 5,
        year: 2026,
        monthlySalary: 2500,
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
   *  GET /api/budget/contributions — liste contributions du groupe
   * ================================================================= */

  it('GET /api/budget/contributions retourne 200 avec tableau de 2 contributions', async () => {
    const res = await request(getHttpServer())
      .get(`/api/budget/contributions?groupId=${GROUP_UUID}&month=5&year=2026`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('userId', 'user-1');
    expect(res.body[0]).toHaveProperty('monthlySalary', 2500);
    expect(res.body[1]).toHaveProperty('userId', MEMBER_UUID);
    expect(res.body[1]).toHaveProperty('monthlySalary', 3200);
  });

  it('GET /api/budget/contributions rejette sans groupId (400)', async () => {
    await request(getHttpServer())
      .get('/api/budget/contributions?month=5&year=2026')
      .expect(400);
  });

  it('GET /api/budget/contributions rejette sans month (400)', async () => {
    await request(getHttpServer())
      .get(`/api/budget/contributions?groupId=${GROUP_UUID}&year=2026`)
      .expect(400);
  });

  it('GET /api/budget/contributions rejette sans year (400)', async () => {
    await request(getHttpServer())
      .get(`/api/budget/contributions?groupId=${GROUP_UUID}&month=5`)
      .expect(400);
  });

  /* =================================================================
   *  POST /api/budget/goals — creation goal
   * ================================================================= */

  it('POST /api/budget/goals cree un goal SAVINGS et retourne 201', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/goals')
      .send({
        groupId: GROUP_UUID,
        name: 'Vacances ete',
        kind: 'SAVINGS',
        targetAmount: 1000,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', 'Vacances');
    expect(res.body).toHaveProperty('kind', 'SAVINGS');
    expect(res.body).toHaveProperty('targetAmount', 1000);
    expect(res.body).toHaveProperty('currentAmount');
    expect(res.body).toHaveProperty('progressPercent');
  });

  it('POST /api/budget/goals rejette un kind invalide (400)', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/goals')
      .send({
        groupId: GROUP_UUID,
        name: 'Vacances',
        kind: 'INVALID_KIND',
        targetAmount: 1000,
      })
      .expect(400);

    expect(extractMessages(res.body).some((m) => m.includes('kind'))).toBe(
      true,
    );
  });

  it('POST /api/budget/goals avec CATEGORY_LIMIT sans categoryId retourne 400', async () => {
    /*
     * La validation du kind se fait au niveau DTO (IsIn), mais la contrainte
     * CATEGORY_LIMIT+categoryId est domaine. Le DTO autorise categoryId
     * optionnel : si absent, le use case leve un InvalidInputError.
     * On mocke le use case pour simuler ce comportement.
     */
    createBudgetGoalUseCase.execute.mockRejectedValueOnce(
      new InvalidInputError('categoryId is required for CATEGORY_LIMIT goals'),
    );

    const res = await request(getHttpServer())
      .post('/api/budget/goals')
      .send({
        groupId: GROUP_UUID,
        name: 'Plafond loyer',
        kind: 'CATEGORY_LIMIT',
        targetAmount: 1200,
      })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) => m.includes('categoryId')),
    ).toBe(true);
  });

  it('POST /api/budget/goals rejette les champs non declares', async () => {
    const res = await request(getHttpServer())
      .post('/api/budget/goals')
      .send({
        groupId: GROUP_UUID,
        name: 'Vacances',
        kind: 'SAVINGS',
        targetAmount: 1000,
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
   *  GET /api/budget/goals — liste goals avec progression
   * ================================================================= */

  it('GET /api/budget/goals retourne 200 avec array BudgetGoalWithProgress', async () => {
    const res = await request(getHttpServer())
      .get(`/api/budget/goals?groupId=${GROUP_UUID}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('kind');
    expect(res.body[0]).toHaveProperty('targetAmount');
    expect(res.body[0]).toHaveProperty('currentAmount');
    expect(res.body[0]).toHaveProperty('progressPercent');
  });

  it('GET /api/budget/goals rejette sans groupId (400)', async () => {
    await request(getHttpServer()).get('/api/budget/goals').expect(400);
  });

  /* =================================================================
   *  PATCH /api/budget/goals/:id — update goal
   * ================================================================= */

  it('PATCH /api/budget/goals/:id retourne 200 avec payload partiel', async () => {
    const res = await request(getHttpServer())
      .patch(`/api/budget/goals/${GOAL_UUID}`)
      .send({ name: 'Vacances modif', targetAmount: 1500 })
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
  });

  it('PATCH /api/budget/goals/:id rejette un UUID invalide (400)', async () => {
    await request(getHttpServer())
      .patch('/api/budget/goals/not-a-uuid')
      .send({ name: 'Test' })
      .expect(400);
  });

  it('PATCH /api/budget/goals/:id rejette les champs non declares', async () => {
    const res = await request(getHttpServer())
      .patch(`/api/budget/goals/${GOAL_UUID}`)
      .send({ name: 'Valide', injected: 'interdit' })
      .expect(400);

    expect(
      extractMessages(res.body).some((m) =>
        m.includes('property injected should not exist'),
      ),
    ).toBe(true);
  });

  /* =================================================================
   *  DELETE /api/budget/goals/:id — delete goal
   * ================================================================= */

  it('DELETE /api/budget/goals/:id retourne 204', async () => {
    await request(getHttpServer())
      .delete(`/api/budget/goals/${GOAL_UUID}`)
      .expect(204);

    expect(deleteBudgetGoalUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ goalId: GOAL_UUID, userId: 'user-1' }),
    );
  });

  it('DELETE /api/budget/goals/:id rejette un UUID invalide (400)', async () => {
    await request(getHttpServer())
      .delete('/api/budget/goals/not-a-uuid')
      .expect(400);
  });

  /* =================================================================
   *  GET /api/budget/groups/:groupId/members — liste membres
   * ================================================================= */

  it('GET /api/budget/groups/:groupId/members retourne 200 avec owner + invite', async () => {
    const res = await request(getHttpServer())
      .get(`/api/budget/groups/${GROUP_UUID}/members`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);

    const owner = res.body.find(
      (m: Record<string, unknown>) => m.isOwner === true,
    );
    const invited = res.body.find(
      (m: Record<string, unknown>) => m.isOwner === false,
    );
    expect(owner).toBeDefined();
    expect(invited).toBeDefined();
    expect(owner).toHaveProperty('userId', 'user-1');
    expect(invited).toHaveProperty('userId', MEMBER_UUID);

    expect(res.body[0]).toHaveProperty('email');
    expect(res.body[0]).toHaveProperty('displayName');
    expect(res.body[0]).toHaveProperty('joinedAt');
  });

  it('GET /api/budget/groups/:groupId/members rejette un groupId UUID invalide (400)', async () => {
    await request(getHttpServer())
      .get('/api/budget/groups/not-a-uuid/members')
      .expect(400);
  });

  /* =================================================================
   *  DELETE /api/budget/groups/:groupId/members/:userId — retrait membre
   * ================================================================= */

  it('DELETE .../members/:userId retourne 204 quand owner retire un membre', async () => {
    await request(getHttpServer())
      .delete(`/api/budget/groups/${GROUP_UUID}/members/${MEMBER_UUID}`)
      .expect(204);

    expect(removeBudgetGroupMemberUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: GROUP_UUID,
        actorUserId: 'user-1',
        targetUserId: MEMBER_UUID,
      }),
    );
  });

  it('DELETE .../members/:userId retourne 403 quand non-owner essaie de retirer', async () => {
    removeBudgetGroupMemberUseCase.execute.mockRejectedValueOnce(
      new InsufficientPermissionsError(
        'Only the group owner can remove members',
      ),
    );

    const res = await request(getHttpServer())
      .delete(`/api/budget/groups/${GROUP_UUID}/members/${MEMBER_UUID}`)
      .expect(403);

    expect(res.body).toHaveProperty('status', 403);
  });

  it('DELETE .../members/:userId rejette un groupId UUID invalide (400)', async () => {
    await request(getHttpServer())
      .delete(`/api/budget/groups/not-a-uuid/members/${MEMBER_UUID}`)
      .expect(400);
  });

  it('DELETE .../members/:userId rejette un userId UUID invalide (400)', async () => {
    await request(getHttpServer())
      .delete(`/api/budget/groups/${GROUP_UUID}/members/not-a-uuid`)
      .expect(400);
  });

  /* =================================================================
   *  GET /api/budget/entries/months — mois ayant des entrees
   * ================================================================= */

  it('GET /api/budget/entries/months retourne 200 avec array [{month, year}]', async () => {
    const res = await request(getHttpServer())
      .get(`/api/budget/entries/months?groupId=${GROUP_UUID}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('month', 3);
    expect(res.body[0]).toHaveProperty('year', 2026);
    expect(res.body[1]).toHaveProperty('month', 4);
    expect(res.body[1]).toHaveProperty('year', 2026);
  });

  it('GET /api/budget/entries/months rejette sans groupId (400)', async () => {
    await request(getHttpServer())
      .get('/api/budget/entries/months')
      .expect(400);
  });

  it('GET /api/budget/entries/months rejette un groupId UUID invalide (400)', async () => {
    await request(getHttpServer())
      .get('/api/budget/entries/months?groupId=not-a-uuid')
      .expect(400);
  });
});
