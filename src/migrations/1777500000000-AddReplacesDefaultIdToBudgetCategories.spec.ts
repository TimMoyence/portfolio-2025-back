import type { QueryRunner } from 'typeorm';
import { AddReplacesDefaultIdToBudgetCategories1777500000000 } from './1777500000000-AddReplacesDefaultIdToBudgetCategories';

describe('AddReplacesDefaultIdToBudgetCategories1777500000000', () => {
  let queries: string[];
  let queryRunner: QueryRunner;
  let migration: AddReplacesDefaultIdToBudgetCategories1777500000000;

  beforeEach(() => {
    queries = [];
    queryRunner = {
      query: jest.fn((sql: string) => {
        queries.push(sql);
        return Promise.resolve(undefined);
      }),
    } as unknown as QueryRunner;
    migration = new AddReplacesDefaultIdToBudgetCategories1777500000000();
  });

  describe('up()', () => {
    it('ajoute la colonne replaces_default_id (uuid, nullable) a budget_categories', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /ALTER TABLE[\s\S]*budget_categories[\s\S]*ADD COLUMN[\s\S]*replaces_default_id[\s\S]*uuid[\s\S]*NULL/i,
      );
    });

    it('cree la FK self-reference vers budget_categories(id) avec ON DELETE SET NULL', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /FOREIGN KEY[\s\S]*replaces_default_id[\s\S]*REFERENCES[\s\S]*budget_categories[\s\S]*ON DELETE SET NULL/i,
      );
    });

    it('cree l index unique partiel (group_id, replaces_default_id)', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /CREATE UNIQUE INDEX[\s\S]*uniq_budget_categories_group_replaces[\s\S]*group_id[\s\S]*replaces_default_id[\s\S]*WHERE[\s\S]*replaces_default_id["\s]+IS NOT NULL/i,
      );
    });

    it('cree l index de lookup sur replaces_default_id', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /CREATE INDEX[\s\S]*idx_budget_categories_replaces_default_id[\s\S]*replaces_default_id/i,
      );
    });

    it('utilise IF NOT EXISTS pour l idempotence', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/IF NOT EXISTS/i);
    });
  });

  describe('down()', () => {
    it('supprime les index et la colonne', async () => {
      await migration.down(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /DROP INDEX IF EXISTS[\s\S]*uniq_budget_categories_group_replaces/i,
      );
      expect(allSql).toMatch(
        /DROP INDEX IF EXISTS[\s\S]*idx_budget_categories_replaces_default_id/i,
      );
      expect(allSql).toMatch(
        /ALTER TABLE[\s\S]*budget_categories[\s\S]*DROP COLUMN IF EXISTS[\s\S]*replaces_default_id/i,
      );
    });
  });
});
