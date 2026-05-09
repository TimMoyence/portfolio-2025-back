import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBudgetEntryDto } from './CreateBudgetEntry.dto';

/**
 * Specs HIGH-1 (audit 2026-05-09) : valider que les DTOs rejettent
 * Infinity/NaN/decimales > 2 / hors borne sur le champ `amount`.
 *
 * `IsNumber()` sans options accepte ces valeurs aberrantes par defaut,
 * ce qui casse les agregats et le rendu PDF (somme = NaN).
 */
describe('CreateBudgetEntryDto — HIGH-1 IsNumber strict', () => {
  const baseDto = {
    groupId: '00000000-0000-4000-8000-000000000001',
    date: '2026-03-15',
    description: 'Carrefour',
    type: 'VARIABLE',
  };

  async function getViolations(amount: unknown): Promise<string[]> {
    const dto = plainToInstance(CreateBudgetEntryDto, { ...baseDto, amount });
    const errors = await validate(dto);
    const amountErr = errors.find((e) => e.property === 'amount');
    return amountErr ? Object.keys(amountErr.constraints ?? {}) : [];
  }

  it('devrait rejeter amount = Infinity', async () => {
    const violations = await getViolations(Number.POSITIVE_INFINITY);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('devrait rejeter amount = -Infinity', async () => {
    const violations = await getViolations(Number.NEGATIVE_INFINITY);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('devrait rejeter amount = NaN', async () => {
    const violations = await getViolations(Number.NaN);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('devrait rejeter amount avec plus de 2 decimales', async () => {
    const violations = await getViolations(12.345);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('devrait rejeter amount > 1_000_000', async () => {
    const violations = await getViolations(1_000_001);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('devrait rejeter amount < -1_000_000', async () => {
    const violations = await getViolations(-1_000_001);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('devrait accepter amount valide (-85.50)', async () => {
    const violations = await getViolations(-85.5);
    expect(violations).toEqual([]);
  });

  it('devrait accepter amount entier valide', async () => {
    const violations = await getViolations(2500);
    expect(violations).toEqual([]);
  });
});
