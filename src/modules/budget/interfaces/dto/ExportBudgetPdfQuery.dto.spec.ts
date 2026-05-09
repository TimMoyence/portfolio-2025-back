import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ExportBudgetPdfQueryDto } from './ExportBudgetPdfQuery.dto';

/**
 * Specs HIGH-4 (audit 2026-05-09) : la query string `month`/`year`/
 * `groupId` etait jusqu'ici brute (Query string + parseInt sans
 * validation), permettant header injection dans le Content-Disposition
 * (`filename="budget-${month}-${year}.pdf"`) et exfiltration cross-tenant.
 */
describe('ExportBudgetPdfQueryDto — HIGH-4 query validation', () => {
  const validQuery = {
    groupId: '00000000-0000-4000-8000-000000000001',
    month: '6',
    year: '2026',
  };

  async function getViolations(
    overrides: Record<string, unknown>,
  ): Promise<Record<string, string[]>> {
    const dto = plainToInstance(ExportBudgetPdfQueryDto, {
      ...validQuery,
      ...overrides,
    });
    const errors = await validate(dto);
    const result: Record<string, string[]> = {};
    for (const e of errors) {
      result[e.property] = Object.keys(e.constraints ?? {});
    }
    return result;
  }

  it('devrait accepter une query valide', async () => {
    const violations = await getViolations({});
    expect(violations).toEqual({});
  });

  it('devrait rejeter month = "foo" (non numerique)', async () => {
    const violations = await getViolations({ month: 'foo' });
    expect(violations.month?.length ?? 0).toBeGreaterThan(0);
  });

  it('devrait rejeter month = 0 (hors borne)', async () => {
    const violations = await getViolations({ month: '0' });
    expect(violations.month?.length ?? 0).toBeGreaterThan(0);
  });

  it('devrait rejeter month = 13 (hors borne)', async () => {
    const violations = await getViolations({ month: '13' });
    expect(violations.month?.length ?? 0).toBeGreaterThan(0);
  });

  it('devrait rejeter month avec injection (CRLF)', async () => {
    const violations = await getViolations({
      month: '01"; X-Injected: yes',
    });
    expect(violations.month?.length ?? 0).toBeGreaterThan(0);
  });

  it('devrait rejeter year = 1999 (hors borne)', async () => {
    const violations = await getViolations({ year: '1999' });
    expect(violations.year?.length ?? 0).toBeGreaterThan(0);
  });

  it('devrait rejeter year = 2200 (hors borne)', async () => {
    const violations = await getViolations({ year: '2200' });
    expect(violations.year?.length ?? 0).toBeGreaterThan(0);
  });

  it('devrait rejeter groupId non-UUID', async () => {
    const violations = await getViolations({ groupId: 'not-a-uuid' });
    expect(violations.groupId?.length ?? 0).toBeGreaterThan(0);
  });

  it('devrait rejeter groupId vide', async () => {
    const violations = await getViolations({ groupId: '' });
    expect(violations.groupId?.length ?? 0).toBeGreaterThan(0);
  });

  it('devrait coercer month string en number', () => {
    const dto = plainToInstance(ExportBudgetPdfQueryDto, {
      ...validQuery,
      month: '6',
    });
    expect(typeof dto.month).toBe('number');
    expect(dto.month).toBe(6);
  });

  it('devrait coercer year string en number', () => {
    const dto = plainToInstance(ExportBudgetPdfQueryDto, {
      ...validQuery,
      year: '2026',
    });
    expect(typeof dto.year).toBe('number');
    expect(dto.year).toBe(2026);
  });
});
