import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EffaceLesReferentsDesPagesAJeton1791909333000 implements MigrationInterface {
  name = 'EffaceLesReferentsDesPagesAJeton1791909333000';

  private static readonly TABLES = ['cookie_consents', 'audit_requests'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of EffaceLesReferentsDesPagesAJeton1791909333000.TABLES) {
      await queryRunner.query(
        `UPDATE "${table}"
            SET "referer" = NULL
          WHERE "referer" ~ '[?&]token='
             OR "referer" ~ '/formations/ia-solopreneurs/toolkit/[^/?#]+'`,
      );
    }
  }

  public down(): Promise<void> {
    return Promise.resolve();
  }
}
