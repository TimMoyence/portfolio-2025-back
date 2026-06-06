import type { QueryRunner } from 'typeorm';
import { DropBudgetTables1777600000000 } from './1777600000000-DropBudgetTables';

describe('DropBudgetTables1777600000000', () => {
  let queries: string[];
  let queryRunner: QueryRunner;
  let migration: DropBudgetTables1777600000000;

  /** Ordre inverse des dependances FK attendu pour les DROP. */
  const expectedDropOrder = [
    'budget_member_contributions',
    'budget_goals',
    'budget_invitations',
    'budget_share_attempts',
    'budget_entries',
    'budget_recurring_entries',
    'budget_categories',
    'budget_group_members',
    'budget_groups',
  ];

  beforeEach(() => {
    queries = [];
    queryRunner = {
      query: jest.fn((sql: string) => {
        queries.push(sql);
        return Promise.resolve(undefined);
      }),
    } as unknown as QueryRunner;
    migration = new DropBudgetTables1777600000000();
  });

  describe('up()', () => {
    it('supprime les 9 tables budget', async () => {
      await migration.up(queryRunner);
      for (const table of expectedDropOrder) {
        expect(queries.join('\n')).toContain(`"${table}"`);
      }
      // Seules les 9 tables budget sont touchees.
      const dropStatements = queries.filter((sql) => /DROP TABLE/i.test(sql));
      expect(dropStatements).toHaveLength(expectedDropOrder.length);
    });

    it('respecte l ordre inverse des dependances FK', async () => {
      await migration.up(queryRunner);
      const droppedTables = queries
        .map((sql) => sql.match(/DROP TABLE IF EXISTS "([a-z_]+)"/i)?.[1])
        .filter((name): name is string => Boolean(name));
      expect(droppedTables).toEqual(expectedDropOrder);
    });

    it('utilise IF EXISTS pour l idempotence', async () => {
      await migration.up(queryRunner);
      for (const sql of queries) {
        expect(sql).toMatch(/DROP TABLE IF EXISTS/i);
      }
    });

    it('ne touche aucune table hors budget', async () => {
      await migration.up(queryRunner);
      for (const sql of queries) {
        expect(sql).toMatch(/"budget_[a-z_]+"/);
        expect(sql).not.toMatch(/"users"|"weather|"sebastian|"lead_magnet/i);
      }
    });
  });

  describe('down()', () => {
    it('est un no-op (retrait definitif assume)', async () => {
      await migration.down(queryRunner);
      expect(queries).toHaveLength(0);
    });
  });
});
