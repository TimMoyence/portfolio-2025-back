import type { BudgetGroup } from '../../src/modules/budget/domain/BudgetGroup';
import type { BudgetCategory } from '../../src/modules/budget/domain/BudgetCategory';
import type { BudgetEntry } from '../../src/modules/budget/domain/BudgetEntry';
import type { IBudgetGroupRepository } from '../../src/modules/budget/domain/IBudgetGroup.repository';
import type { IBudgetCategoryRepository } from '../../src/modules/budget/domain/IBudgetCategory.repository';
import type { IBudgetEntryRepository } from '../../src/modules/budget/domain/IBudgetEntry.repository';
import type { IBudgetShareNotifier } from '../../src/modules/budget/domain/IBudgetShareNotifier';

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
  };
}

/** Cree un mock complet du repository categories de budget. */
export function createMockBudgetCategoryRepo(): jest.Mocked<IBudgetCategoryRepository> {
  return {
    create: jest.fn(),
    findByGroupId: jest.fn(),
    findDefaults: jest.fn(),
    findById: jest.fn(),
  };
}

/** Cree un mock complet du repository entrees de budget. */
export function createMockBudgetEntryRepo(): jest.Mocked<IBudgetEntryRepository> {
  return {
    create: jest.fn(),
    createMany: jest.fn(),
    findByFilters: jest.fn(),
    findById: jest.fn(),
  };
}

/** Cree un mock du notifier de partage de budget. */
export function createMockBudgetShareNotifier(): jest.Mocked<IBudgetShareNotifier> {
  return {
    sendBudgetShareNotification: jest.fn(),
  };
}
