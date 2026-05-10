import type { QueryRunner } from 'typeorm';
import { CreateBudgetMemberContributions1777100000000 } from './1777100000000-CreateBudgetMemberContributions';

describe('CreateBudgetMemberContributions1777100000000', () => {
  let queries: string[];
  let queryRunner: QueryRunner;
  let migration: CreateBudgetMemberContributions1777100000000;

  beforeEach(() => {
    queries = [];
    queryRunner = {
      query: jest.fn((sql: string) => {
        queries.push(sql);
        return Promise.resolve(undefined);
      }),
    } as unknown as QueryRunner;
    migration = new CreateBudgetMemberContributions1777100000000();
  });

  describe('up()', () => {
    it('cree la table budget_member_contributions', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/CREATE TABLE[\s\S]*budget_member_contributions/i);
    });

    it('definit toutes les colonnes attendues', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/\bid\b[\s\S]*UUID[\s\S]*PRIMARY KEY/i);
      expect(allSql).toMatch(/group_id[\s\S]*UUID[\s\S]*NOT NULL/i);
      expect(allSql).toMatch(/user_id[\s\S]*UUID[\s\S]*NOT NULL/i);
      expect(allSql).toMatch(/month[\s\S]*SMALLINT[\s\S]*NOT NULL/i);
      expect(allSql).toMatch(/year[\s\S]*SMALLINT[\s\S]*NOT NULL/i);
      expect(allSql).toMatch(
        /monthly_salary[\s\S]*NUMERIC\(10\s*,\s*2\)[\s\S]*NOT NULL/i,
      );
      expect(allSql).toMatch(/created_at[\s\S]*TIMESTAMPTZ/i);
      expect(allSql).toMatch(/updated_at[\s\S]*TIMESTAMPTZ/i);
    });

    it('contraint month entre 1 et 12 et year entre 2000 et 2100', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/CHECK[\s\S]*month[\s\S]*1[\s\S]*12/i);
      expect(allSql).toMatch(/CHECK[\s\S]*year[\s\S]*2000[\s\S]*2100/i);
      expect(allSql).toMatch(/CHECK[\s\S]*monthly_salary[\s\S]*>=\s*0/i);
    });

    it('declare FK group_id ON DELETE CASCADE', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /group_id[\s\S]*REFERENCES[\s\S]*budget_groups[\s\S]*ON DELETE CASCADE/i,
      );
    });

    it('declare FK user_id ON DELETE CASCADE', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /user_id[\s\S]*REFERENCES[\s\S]*users[\s\S]*ON DELETE CASCADE/i,
      );
    });

    it('contrainte unique uq_contrib_unique sur (group_id,user_id,month,year)', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /uq_contrib_unique[\s\S]*UNIQUE[\s\S]*group_id[\s\S]*user_id[\s\S]*month[\s\S]*year/i,
      );
    });

    it('cree index idx_contrib_group_period sur (group_id,year,month)', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /CREATE INDEX[\s\S]*idx_contrib_group_period[\s\S]*budget_member_contributions[\s\S]*group_id[\s\S]*year[\s\S]*month/i,
      );
    });
  });

  describe('down()', () => {
    it('supprime la table budget_member_contributions', async () => {
      await migration.down(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/DROP TABLE[\s\S]*budget_member_contributions/i);
    });
  });
});
