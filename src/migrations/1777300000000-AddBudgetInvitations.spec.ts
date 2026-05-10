import type { QueryRunner } from 'typeorm';
import { AddBudgetInvitations1777300000000 } from './1777300000000-AddBudgetInvitations';

describe('AddBudgetInvitations1777300000000', () => {
  let queries: string[];
  let queryRunner: QueryRunner;
  let migration: AddBudgetInvitations1777300000000;

  beforeEach(() => {
    queries = [];
    queryRunner = {
      query: jest.fn((sql: string) => {
        queries.push(sql);
        return Promise.resolve(undefined);
      }),
    } as unknown as QueryRunner;
    migration = new AddBudgetInvitations1777300000000();
  });

  describe('up()', () => {
    it('cree la table budget_invitations', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/CREATE TABLE[\s\S]*budget_invitations/i);
    });

    it('definit toutes les colonnes attendues', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/\bid\b[\s\S]*uuid[\s\S]*PRIMARY KEY/i);
      expect(allSql).toMatch(/group_id[\s\S]*uuid[\s\S]*NOT NULL/i);
      expect(allSql).toMatch(/inviter_user_id[\s\S]*uuid[\s\S]*NOT NULL/i);
      expect(allSql).toMatch(
        /target_email[\s\S]*varchar\(254\)[\s\S]*NOT NULL/i,
      );
      expect(allSql).toMatch(/token_hash[\s\S]*varchar\(64\)[\s\S]*NOT NULL/i);
      expect(allSql).toMatch(/expires_at[\s\S]*timestamptz[\s\S]*NOT NULL/i);
      expect(allSql).toMatch(/accepted_at[\s\S]*timestamptz[\s\S]*NULL/i);
      expect(allSql).toMatch(/accepted_by_user_id[\s\S]*uuid[\s\S]*NULL/i);
      expect(allSql).toMatch(/revoked_at[\s\S]*timestamptz[\s\S]*NULL/i);
      expect(allSql).toMatch(/created_at[\s\S]*timestamptz[\s\S]*DEFAULT NOW/i);
    });

    it('contrainte unique globale sur token_hash', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /uq_budget_invitations_token_hash[\s\S]*UNIQUE[\s\S]*token_hash/i,
      );
    });

    it('cree l index unique partiel uq_budget_invitations_active', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /CREATE UNIQUE INDEX[\s\S]*uq_budget_invitations_active[\s\S]*group_id[\s\S]*target_email[\s\S]*WHERE[\s\S]*accepted_at[\s\S]*IS NULL[\s\S]*revoked_at[\s\S]*IS NULL/i,
      );
    });

    it('cree l index partiel idx_budget_invitations_group_pending', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /CREATE INDEX[\s\S]*idx_budget_invitations_group_pending[\s\S]*group_id[\s\S]*WHERE[\s\S]*accepted_at[\s\S]*IS NULL[\s\S]*revoked_at[\s\S]*IS NULL/i,
      );
    });
  });

  describe('down()', () => {
    it('supprime la table et les index', async () => {
      await migration.down(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(
        /DROP INDEX IF EXISTS[\s\S]*idx_budget_invitations_group_pending/i,
      );
      expect(allSql).toMatch(
        /DROP INDEX IF EXISTS[\s\S]*uq_budget_invitations_active/i,
      );
      expect(allSql).toMatch(/DROP TABLE IF EXISTS[\s\S]*budget_invitations/i);
    });
  });
});
