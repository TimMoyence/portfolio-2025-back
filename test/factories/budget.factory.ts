import type { BudgetGroup } from '../../src/modules/budget/domain/BudgetGroup';
import type { BudgetCategory } from '../../src/modules/budget/domain/BudgetCategory';
import type { BudgetEntry } from '../../src/modules/budget/domain/BudgetEntry';
import type {
  BudgetGoal,
  BudgetGoalKind,
  BudgetGoalWithProgress,
} from '../../src/modules/budget/domain/BudgetGoal';
import type { IBudgetGoalRepository } from '../../src/modules/budget/domain/IBudgetGoal.repository';
import type { RecurringEntry } from '../../src/modules/budget/domain/RecurringEntry';
import type { IBudgetGroupRepository } from '../../src/modules/budget/domain/IBudgetGroup.repository';
import type { IBudgetCategoryRepository } from '../../src/modules/budget/domain/IBudgetCategory.repository';
import type { IBudgetEntryRepository } from '../../src/modules/budget/domain/IBudgetEntry.repository';
import type { IRecurringEntryRepository } from '../../src/modules/budget/domain/IRecurringEntry.repository';
import type { IBudgetShareNotifier } from '../../src/modules/budget/domain/IBudgetShareNotifier';
import type { IBudgetShareAttemptRepository } from '../../src/modules/budget/domain/IBudgetShareAttempt.repository';
import type { BudgetMemberContribution } from '../../src/modules/budget/domain/BudgetMemberContribution';
import type { IBudgetMemberContributionRepository } from '../../src/modules/budget/domain/IBudgetMemberContribution.repository';
import type { BudgetMember } from '../../src/modules/budget/domain/BudgetMember';
import type { CreateBudgetGroupUseCase } from '../../src/modules/budget/application/services/CreateBudgetGroup.useCase';
import type { GetBudgetGroupsUseCase } from '../../src/modules/budget/application/services/GetBudgetGroups.useCase';
import type { CreateBudgetEntryUseCase } from '../../src/modules/budget/application/services/CreateBudgetEntry.useCase';
import type { GetBudgetEntriesUseCase } from '../../src/modules/budget/application/services/GetBudgetEntries.useCase';
import type { GetBudgetSummaryUseCase } from '../../src/modules/budget/application/services/GetBudgetSummary.useCase';
import type { ImportBudgetEntriesUseCase } from '../../src/modules/budget/application/services/ImportBudgetEntries.useCase';
import type { UpdateBudgetEntryUseCase } from '../../src/modules/budget/application/services/UpdateBudgetEntry.useCase';
import type { DeleteBudgetEntryUseCase } from '../../src/modules/budget/application/services/DeleteBudgetEntry.useCase';
import type { CreateBudgetCategoryUseCase } from '../../src/modules/budget/application/services/CreateBudgetCategory.useCase';
import type { GetBudgetCategoriesUseCase } from '../../src/modules/budget/application/services/GetBudgetCategories.useCase';
import type { UpdateBudgetCategoryUseCase } from '../../src/modules/budget/application/services/UpdateBudgetCategory.useCase';
import type { ShareBudgetUseCase } from '../../src/modules/budget/application/services/ShareBudget.useCase';
import type { GetBudgetGroupMembersUseCase } from '../../src/modules/budget/application/services/GetBudgetGroupMembers.useCase';
import type { RemoveBudgetGroupMemberUseCase } from '../../src/modules/budget/application/services/RemoveBudgetGroupMember.useCase';
import type { GetBudgetEntriesMonthsUseCase } from '../../src/modules/budget/application/services/GetBudgetEntriesMonths.useCase';

/** Construit un objet BudgetGroup domaine avec des valeurs par defaut. */
export function buildBudgetGroup(
  overrides?: Partial<BudgetGroup>,
): BudgetGroup {
  return {
    id: 'group-1',
    name: 'Budget couple T&M',
    ownerId: 'user-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as BudgetGroup;
}

/** Construit un objet BudgetCategory domaine avec des valeurs par defaut. */
export function buildBudgetCategory(
  overrides?: Partial<BudgetCategory>,
): BudgetCategory {
  return {
    id: 'cat-1',
    groupId: null,
    name: 'Courses',
    color: '#22C55E',
    icon: 'shopping-cart',
    budgetType: 'VARIABLE',
    budgetLimit: 600,
    displayOrder: 8,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  } as BudgetCategory;
}

/** Construit un objet BudgetEntry domaine avec des valeurs par defaut. */
export function buildBudgetEntry(
  overrides?: Partial<BudgetEntry>,
): BudgetEntry {
  return {
    id: 'entry-1',
    groupId: 'group-1',
    createdByUserId: 'user-1',
    categoryId: 'cat-1',
    date: new Date('2026-03-15'),
    description: 'Carrefour courses',
    amount: -85.5,
    type: 'VARIABLE',
    state: 'COMPLETED',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as BudgetEntry;
}

/** Cree un mock complet du repository groupes de budget. */
export function createMockBudgetGroupRepo(): jest.Mocked<IBudgetGroupRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByOwnerId: jest.fn(),
    findByMemberId: jest.fn(),
    addMember: jest.fn(),
    isMember: jest.fn(),
    isOwner: jest.fn(),
    findMembersWithUsers: jest.fn(),
    removeMember: jest.fn(),
  };
}

/** Cree un mock complet du repository categories de budget. */
export function createMockBudgetCategoryRepo(): jest.Mocked<IBudgetCategoryRepository> {
  return {
    create: jest.fn(),
    findByGroupId: jest.fn(),
    findDefaults: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };
}

/** Cree un mock complet du repository entrees de budget. */
export function createMockBudgetEntryRepo(): jest.Mocked<IBudgetEntryRepository> {
  return {
    create: jest.fn(),
    createMany: jest.fn(),
    findByFilters: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findDistinctMonths: jest.fn(),
  };
}

/** Cree un mock du notifier de partage de budget. */
export function createMockBudgetShareNotifier(): jest.Mocked<IBudgetShareNotifier> {
  return {
    sendBudgetShareNotification: jest.fn(),
    sendBudgetInvitation: jest.fn(),
  };
}

/** Cree un mock complet du repository de tentatives de partage. */
export function createMockBudgetShareAttemptRepo(): jest.Mocked<IBudgetShareAttemptRepository> {
  return {
    findRecent: jest.fn(),
    record: jest.fn(),
    countByInviterSince: jest.fn(),
  };
}

/** Construit un objet RecurringEntry domaine avec des valeurs par defaut. */
export function buildRecurringEntry(
  overrides?: Partial<RecurringEntry>,
): RecurringEntry {
  return {
    id: 'recurring-1',
    groupId: 'group-1',
    createdByUserId: 'user-1',
    categoryId: 'cat-1',
    description: 'Loyer mensuel',
    amount: -1200,
    type: 'FIXED',
    frequency: 'MONTHLY',
    dayOfMonth: 1,
    dayOfWeek: null,
    startDate: new Date('2026-01-01'),
    endDate: null,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  } as RecurringEntry;
}

/** Cree un mock complet du repository entrees recurrentes de budget. */
export function createMockRecurringEntryRepo(): jest.Mocked<IRecurringEntryRepository> {
  return {
    create: jest.fn(),
    findByGroupId: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findActiveByGroupId: jest.fn(),
  };
}

/** Construit un objet BudgetMemberContribution domaine avec des valeurs par defaut. */
export function buildBudgetMemberContribution(
  overrides?: Partial<BudgetMemberContribution>,
): BudgetMemberContribution {
  return {
    id: 'contrib-1',
    groupId: 'group-1',
    userId: 'user-1',
    month: 5,
    year: 2026,
    monthlySalary: 2500,
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-01'),
    ...overrides,
  } as BudgetMemberContribution;
}

/** Cree un mock complet du repository contributions de membres. */
export function createMockBudgetMemberContributionRepo(): jest.Mocked<IBudgetMemberContributionRepository> {
  return {
    findByGroupAndPeriod: jest.fn(),
    upsertForUser: jest.fn(),
    findLastForUserBefore: jest.fn(),
  };
}

/** Typage des mocks de use cases du module Budget. */
export interface MockBudgetUseCases {
  createGroup: jest.Mocked<Pick<CreateBudgetGroupUseCase, 'execute'>>;
  getGroups: jest.Mocked<Pick<GetBudgetGroupsUseCase, 'execute'>>;
  createEntry: jest.Mocked<Pick<CreateBudgetEntryUseCase, 'execute'>>;
  getEntries: jest.Mocked<Pick<GetBudgetEntriesUseCase, 'execute'>>;
  getSummary: jest.Mocked<Pick<GetBudgetSummaryUseCase, 'execute'>>;
  importEntries: jest.Mocked<Pick<ImportBudgetEntriesUseCase, 'execute'>>;
  updateEntry: jest.Mocked<Pick<UpdateBudgetEntryUseCase, 'execute'>>;
  deleteEntry: jest.Mocked<Pick<DeleteBudgetEntryUseCase, 'execute'>>;
  createCategory: jest.Mocked<Pick<CreateBudgetCategoryUseCase, 'execute'>>;
  getCategories: jest.Mocked<Pick<GetBudgetCategoriesUseCase, 'execute'>>;
  updateCategory: jest.Mocked<Pick<UpdateBudgetCategoryUseCase, 'execute'>>;
  shareBudget: jest.Mocked<Pick<ShareBudgetUseCase, 'execute'>>;
  getMembers: jest.Mocked<Pick<GetBudgetGroupMembersUseCase, 'execute'>>;
  removeMember: jest.Mocked<Pick<RemoveBudgetGroupMemberUseCase, 'execute'>>;
  getEntriesMonths: jest.Mocked<Pick<GetBudgetEntriesMonthsUseCase, 'execute'>>;
}

/** Construit un objet BudgetGoalWithProgress domaine avec des valeurs par defaut. */
export function buildBudgetGoalWithProgress(
  overrides?: Partial<BudgetGoalWithProgress>,
): BudgetGoalWithProgress {
  return {
    id: 'goal-1',
    groupId: 'group-1',
    createdByUserId: 'user-1',
    name: 'Vacances',
    kind: 'SAVINGS' as BudgetGoalKind,
    targetAmount: 1000,
    categoryId: null,
    deadline: null,
    isActive: true,
    currentAmount: 250,
    progressPercent: 25,
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-01'),
    ...overrides,
  } as BudgetGoalWithProgress;
}

/** Construit un objet BudgetGoal domaine avec des valeurs par defaut. */
export function buildBudgetGoal(overrides?: Partial<BudgetGoal>): BudgetGoal {
  return {
    id: 'goal-1',
    groupId: 'group-1',
    createdByUserId: 'user-1',
    name: 'Vacances',
    kind: 'SAVINGS' as BudgetGoalKind,
    targetAmount: 1000,
    categoryId: null,
    deadline: null,
    isActive: true,
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-01'),
    ...overrides,
  } as BudgetGoal;
}

/** Cree un mock complet du repository des objectifs de budget. */
export function createMockBudgetGoalRepo(): jest.Mocked<IBudgetGoalRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByGroupId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

/** Construit un objet BudgetMember (vue lecture enrichie) avec des valeurs par defaut. */
export function buildBudgetMember(
  overrides?: Partial<BudgetMember>,
): BudgetMember {
  return {
    userId: 'user-1',
    email: 'user1@example.com',
    displayName: 'Utilisateur 1',
    isOwner: false,
    joinedAt: new Date('2026-01-15'),
    ...overrides,
  } as BudgetMember;
}

/** Cree des mocks types pour tous les use cases du BudgetController. */
export function createMockBudgetUseCases(): MockBudgetUseCases {
  return {
    createGroup: { execute: jest.fn() },
    getGroups: { execute: jest.fn() },
    createEntry: { execute: jest.fn() },
    getEntries: { execute: jest.fn() },
    getSummary: { execute: jest.fn() },
    importEntries: { execute: jest.fn() },
    updateEntry: { execute: jest.fn() },
    deleteEntry: { execute: jest.fn() },
    createCategory: { execute: jest.fn() },
    getCategories: { execute: jest.fn() },
    updateCategory: { execute: jest.fn() },
    shareBudget: { execute: jest.fn() },
    getMembers: { execute: jest.fn() },
    removeMember: { execute: jest.fn() },
    getEntriesMonths: { execute: jest.fn() },
  };
}
