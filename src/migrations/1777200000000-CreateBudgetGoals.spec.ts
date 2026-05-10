import type { QueryRunner } from 'typeorm';
import { CreateBudgetGoals1777200000000 } from './1777200000000-CreateBudgetGoals';

describe('CreateBudgetGoals1777200000000', () => {
  let queries: string[];
  let queryRunner: QueryRunner;
  let migration: CreateBudgetGoals1777200000000;

  beforeEach(() => {
    queries = [];
    queryRunner = {
      query: jest.fn((sql: string) => {
        queries.push(sql);
        return Promise.resolve(undefined);
      }),
    } as unknown as QueryRunner;
    migration = new CreateBudgetGoals1777200000000();
  });

  describe('up()', () => {
    it('cree la table budget_goals', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/CREATE TABLE[\s\S]*budget_goals/i);
    });

    it('definit toutes les colonnes attendues', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/\bid\b[\s\S]*UUID[\s\S]*PRIMARY KEY/i);
      expect(allSql).toMatch(/group_id[\s\S]*UUID[\s\S]*NOT NULL/i);
      expect(allSql).toMatch(/created_by_user_id[\s\S]*UUID[\s\S]*NOT NULL/i);
      expect(allSql).toMatch(/\bname\b[\s\S]*VARCHAR\(120\)[\s\S]*NOT NULL/i);
      expect(allSql).toMatch(/\bkind\b[\s\S]*VARCHAR\(20\)[\s\S]*NOT NULL/i);
      expect(allSql).toMatch(
        /target_amount[\s\S]*NUMERIC\(12\s*,\s*2\)[\s\S]*NOT NULL/i,
      );
      expect(allSql).toMatch(/category_id[\s\S]*UUID/i);
      expect(allSql).toMatch(/deadline[\s\S]*TIMESTAMPTZ/i);
      expect(allSql).toMatch(
        /is_active[\s\S]*BOOLEAN[\s\S]*DEFAULT[\s\S]*true/i,
      );
      expect(allSql).toMatch(/created_at[\s\S]*TIMESTAMPTZ/i);
      expect(allSql).toMatch(/updated_at[\s\S]*TIMESTAMPTZ/i);
    });

    it('contraint kind dans (SAVINGS, SPENDING_LIMIT, CATEGORY_LIMIT)', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /CHECK[\s\S]*kind[\s\S]*SAVINGS[\s\S]*SPENDING_LIMIT[\s\S]*CATEGORY_LIMIT/i,
      );
    });

    it('contraint target_amount >= 0', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/CHECK[\s\S]*target_amount[\s\S]*>=\s*0/i);
    });

    it('contraint chk_goal_category : CATEGORY_LIMIT exige category_id', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /chk_goal_category[\s\S]*CATEGORY_LIMIT[\s\S]*category_id[\s\S]*IS NOT NULL/i,
      );
    });

    it('FK group_id ON DELETE CASCADE', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /group_id[\s\S]*REFERENCES[\s\S]*budget_groups[\s\S]*ON DELETE CASCADE/i,
      );
    });

    it('FK created_by_user_id REFERENCES users (no cascade explicite)', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /created_by_user_id[\s\S]*REFERENCES[\s\S]*users/i,
      );
    });

    it('FK category_id ON DELETE SET NULL', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /category_id[\s\S]*REFERENCES[\s\S]*budget_categories[\s\S]*ON DELETE SET NULL/i,
      );
    });
  });

  describe('down()', () => {
    it('supprime la table budget_goals', async () => {
      await migration.down(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/DROP TABLE[\s\S]*budget_goals/i);
    });
  });
});
