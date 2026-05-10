import type { QueryRunner } from 'typeorm';
import { AddInviterUserIdToBudgetShareAttempts1777400000000 } from './1777400000000-AddInviterUserIdToBudgetShareAttempts';

describe('AddInviterUserIdToBudgetShareAttempts1777400000000', () => {
  let queries: string[];
  let queryRunner: QueryRunner;
  let migration: AddInviterUserIdToBudgetShareAttempts1777400000000;

  beforeEach(() => {
    queries = [];
    queryRunner = {
      query: jest.fn((sql: string) => {
        queries.push(sql);
        return Promise.resolve(undefined);
      }),
    } as unknown as QueryRunner;
    migration = new AddInviterUserIdToBudgetShareAttempts1777400000000();
  });

  describe('up()', () => {
    it('ajoute la colonne inviter_user_id nullable a budget_share_attempts', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /ALTER TABLE[\s\S]*budget_share_attempts[\s\S]*ADD COLUMN[\s\S]*inviter_user_id[\s\S]*uuid[\s\S]*NULL/i,
      );
    });

    it('cree l index compose idx_budget_share_attempts_inviter_quota', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /CREATE INDEX[\s\S]*idx_budget_share_attempts_inviter_quota[\s\S]*inviter_user_id[\s\S]*sent_at/i,
      );
    });

    it('utilise IF NOT EXISTS pour l idempotence', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/IF NOT EXISTS/i);
    });
  });

  describe('down()', () => {
    it('supprime l index et la colonne', async () => {
      await migration.down(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /DROP INDEX IF EXISTS[\s\S]*idx_budget_share_attempts_inviter_quota/i,
      );
      expect(allSql).toMatch(
        /ALTER TABLE[\s\S]*budget_share_attempts[\s\S]*DROP COLUMN IF EXISTS[\s\S]*inviter_user_id/i,
      );
    });
  });
});
