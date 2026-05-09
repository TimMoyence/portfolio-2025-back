import { BudgetPdfRenderer } from './BudgetPdfRenderer';
import {
  buildBudgetCategory,
  buildBudgetEntry,
} from '../../../../../test/factories/budget.factory';
import type { BudgetPdfPayload } from '../../domain/IBudgetPdfRenderer';

describe('BudgetPdfRenderer', () => {
  let renderer: BudgetPdfRenderer;

  beforeEach(() => {
    renderer = new BudgetPdfRenderer();
  });

  const buildPayload = (
    overrides?: Partial<BudgetPdfPayload>,
  ): BudgetPdfPayload => ({
    command: {
      userId: 'user-1',
      groupId: 'group-1',
      month: 3,
      year: 2026,
    },
    entries: [],
    categories: [],
    generatedAt: new Date('2026-03-31T12:00:00Z'),
    ...overrides,
  });

  it('produit un Buffer non vide pour un payload minimal', async () => {
    const buffer = await renderer.render(buildPayload());

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('produit un PDF avec magic bytes %PDF', async () => {
    const buffer = await renderer.render(
      buildPayload({
        entries: [
          buildBudgetEntry({ amount: -120, categoryId: 'cat-1' }),
          buildBudgetEntry({
            id: 'entry-2',
            amount: 1500,
            categoryId: 'cat-2',
          }),
        ],
        categories: [
          buildBudgetCategory({ id: 'cat-1', name: 'Courses' }),
          buildBudgetCategory({
            id: 'cat-2',
            name: 'Salaire',
            budgetType: 'FIXED',
            budgetLimit: 0,
          }),
        ],
      }),
    );

    expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
  });

  it('rend un PDF meme sur un mois avec valeur hors plage MOIS_FR', async () => {
    const buffer = await renderer.render(
      buildPayload({
        command: {
          userId: 'user-1',
          groupId: 'group-1',
          month: 13,
          year: 2026,
        },
      }),
    );

    expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
  });
});
