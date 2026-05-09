import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImportBudgetEntriesDto } from './ImportBudgetEntries.dto';

/**
 * Specs HIGH-2 (audit 2026-05-09) : la limite CSV inline etait 5 MB
 * (`@MaxLength(5_000_000)`), provoquant un DoS event-loop a cause du
 * parser O(n) avec concatenation de strings. On ramene la limite a
 * 500_000 caracteres (~10000 lignes typiques d'un export Revolut).
 */
describe('ImportBudgetEntriesDto — HIGH-2 CSV size limit', () => {
  const validGroupId = '00000000-0000-4000-8000-000000000001';

  async function getViolations(csvContent: string): Promise<string[]> {
    const dto = plainToInstance(ImportBudgetEntriesDto, {
      groupId: validGroupId,
      csvContent,
    });
    const errors = await validate(dto);
    const fieldErr = errors.find((e) => e.property === 'csvContent');
    return fieldErr ? Object.keys(fieldErr.constraints ?? {}) : [];
  }

  it('devrait rejeter un csvContent > 500_000 caracteres', async () => {
    const tooLarge = 'a'.repeat(500_001);
    const violations = await getViolations(tooLarge);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('devrait rejeter un csvContent vide', async () => {
    const violations = await getViolations('');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('devrait accepter un csvContent <= 500_000 caracteres', async () => {
    const ok = 'a'.repeat(500_000);
    const violations = await getViolations(ok);
    expect(violations).toEqual([]);
  });
});
