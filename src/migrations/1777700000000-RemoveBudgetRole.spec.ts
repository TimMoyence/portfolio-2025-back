import type { QueryRunner } from 'typeorm';
import { RemoveBudgetRole1777700000000 } from './1777700000000-RemoveBudgetRole';

describe('RemoveBudgetRole1777700000000', () => {
  let queries: string[];
  let queryRunner: QueryRunner;
  let migration: RemoveBudgetRole1777700000000;

  beforeEach(() => {
    queries = [];
    queryRunner = {
      query: jest.fn((sql: string) => {
        queries.push(sql);
        return Promise.resolve(undefined);
      }),
    } as unknown as QueryRunner;
    migration = new RemoveBudgetRole1777700000000();
  });

  describe('up()', () => {
    it('met a jour la colonne roles de la table users', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/UPDATE[\s\S]*"users"[\s\S]*SET[\s\S]*"roles"/i);
    });

    it('retire le token budget via array_remove sur la CSV simple-array', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      // simple-array = CSV text -> string_to_array / array_remove / array_to_string
      expect(allSql).toMatch(/string_to_array[\s\S]*"roles"[\s\S]*','/i);
      expect(allSql).toMatch(/array_remove[\s\S]*'budget'/i);
      expect(allSql).toMatch(/array_to_string/i);
    });

    it('ne cible que les lignes contenant reellement le role budget', async () => {
      await migration.up(queryRunner);
      const allSql = queries.join('\n');
      expect(allSql).toMatch(/WHERE[\s\S]*"roles"[\s\S]*budget/i);
    });
  });

  describe('down()', () => {
    it('est un no-op (retrait definitif assume)', async () => {
      await migration.down(queryRunner);
      expect(queries).toHaveLength(0);
    });
  });
});
