import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBudgetCategoryDto } from './CreateBudgetCategory.dto';

/**
 * Specs HIGH-1 (audit 2026-05-09) : `budgetLimit` doit rejeter les
 * valeurs aberrantes (Infinity, NaN, decimales excessives).
 */
describe('CreateBudgetCategoryDto — HIGH-1 IsNumber strict', () => {
  const baseDto = {
    groupId: '00000000-0000-4000-8000-000000000001',
    name: 'Courses',
    budgetType: 'VARIABLE',
  };

  async function getViolations(budgetLimit: unknown): Promise<string[]> {
    const dto = plainToInstance(CreateBudgetCategoryDto, {
      ...baseDto,
      budgetLimit,
    });
    const errors = await validate(dto);
    const limitErr = errors.find((e) => e.property === 'budgetLimit');
    return limitErr ? Object.keys(limitErr.constraints ?? {}) : [];
  }

  it('devrait rejeter budgetLimit = Infinity', async () => {
    const violations = await getViolations(Number.POSITIVE_INFINITY);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('devrait rejeter budgetLimit = NaN', async () => {
    const violations = await getViolations(Number.NaN);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('devrait rejeter budgetLimit avec plus de 2 decimales', async () => {
    const violations = await getViolations(600.123);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('devrait rejeter budgetLimit > 1_000_000', async () => {
    const violations = await getViolations(1_000_001);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('devrait accepter budgetLimit valide', async () => {
    const violations = await getViolations(600);
    expect(violations).toEqual([]);
  });
});
