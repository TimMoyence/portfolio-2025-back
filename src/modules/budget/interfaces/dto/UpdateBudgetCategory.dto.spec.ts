import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateBudgetCategoryDto } from './UpdateBudgetCategory.dto';

/**
 * Specs HIGH-3 (audit 2026-05-09) : `color` et `icon` dans le DTO Update
 * doivent appliquer les memes contraintes regex que dans le DTO Create
 * pour eviter une stored XSS / CSS injection via update.
 */
describe('UpdateBudgetCategoryDto — HIGH-3 regex color/icon + IsNumber strict', () => {
  async function getViolations(
    field: 'color' | 'icon' | 'budgetLimit',
    value: unknown,
  ): Promise<string[]> {
    const dto = plainToInstance(UpdateBudgetCategoryDto, { [field]: value });
    const errors = await validate(dto);
    const fieldErr = errors.find((e) => e.property === field);
    return fieldErr ? Object.keys(fieldErr.constraints ?? {}) : [];
  }

  describe('color', () => {
    it('devrait rejeter color = "javascript:alert(1)"', async () => {
      const violations = await getViolations('color', 'javascript:alert(1)');
      expect(violations.length).toBeGreaterThan(0);
    });

    it('devrait rejeter color = "red" (pas hex)', async () => {
      const violations = await getViolations('color', 'red');
      expect(violations.length).toBeGreaterThan(0);
    });

    it('devrait rejeter color = "#GGGGGG" (hex invalide)', async () => {
      const violations = await getViolations('color', '#GGGGGG');
      expect(violations.length).toBeGreaterThan(0);
    });

    it('devrait rejeter color trop long (overflow)', async () => {
      const violations = await getViolations(
        'color',
        '#22C55E' + 'A'.repeat(100),
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it('devrait accepter color hex valide', async () => {
      const violations = await getViolations('color', '#22C55E');
      expect(violations).toEqual([]);
    });
  });

  describe('icon', () => {
    it('devrait rejeter icon avec caracteres non slug', async () => {
      const violations = await getViolations(
        'icon',
        '<script>alert(1)</script>',
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it('devrait rejeter icon avec espaces', async () => {
      const violations = await getViolations('icon', 'shopping cart');
      expect(violations.length).toBeGreaterThan(0);
    });

    it('devrait rejeter icon trop long (>50)', async () => {
      const violations = await getViolations('icon', 'a'.repeat(60));
      expect(violations.length).toBeGreaterThan(0);
    });

    it('devrait accepter icon slug valide', async () => {
      const violations = await getViolations('icon', 'shopping-cart');
      expect(violations).toEqual([]);
    });
  });

  describe('budgetLimit (HIGH-1 alignement)', () => {
    it('devrait rejeter budgetLimit = Infinity', async () => {
      const violations = await getViolations(
        'budgetLimit',
        Number.POSITIVE_INFINITY,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it('devrait rejeter budgetLimit = NaN', async () => {
      const violations = await getViolations('budgetLimit', Number.NaN);
      expect(violations.length).toBeGreaterThan(0);
    });
  });
});
