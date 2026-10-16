import { MigrationInterface, QueryRunner } from 'typeorm';
import { boiteDeLivraison } from '../common/domain/value-objects/boite-de-livraison';

const TABLES = [
  {
    table: 'audit_requests',
    adresse: 'contactValue',
    index: 'idx_audit_requests_boite_created_at',
    colonnesIndexees: '"boite", "created_at"',
  },
  {
    table: 'newsletter_subscribers',
    adresse: 'email',
    index: 'idx_newsletter_boite',
    colonnesIndexees: '"boite"',
  },
  {
    table: 'lead_magnet_requests',
    adresse: 'email',
    index: 'idx_lead_magnet_requests_boite_slug',
    colonnesIndexees: '"boite", "formation_slug"',
  },
] as const;

export class BoiteDeLivraison1792136477037 implements MigrationInterface {
  name = 'BoiteDeLivraison1792136477037';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { table, adresse, index, colonnesIndexees } of TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD "boite" text`);
      const saisies = (
        await queryRunner.manager.query<{ adresse: string }[]>(
          `SELECT DISTINCT "${adresse}" AS "adresse" FROM "${table}"`,
        )
      ).map((saisie) => saisie.adresse);
      await queryRunner.query(
        `UPDATE "${table}" SET "boite" = remplie."boite"
         FROM unnest($1::text[], $2::text[]) AS remplie("adresse", "boite")
         WHERE "${table}"."${adresse}" = remplie."adresse"`,
        [saisies, saisies.map(boiteDeLivraison)],
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "boite" SET NOT NULL`,
      );
      await queryRunner.query(
        `CREATE INDEX "${index}" ON "${table}" (${colonnesIndexees})`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { table, index } of [...TABLES].reverse()) {
      await queryRunner.query(`DROP INDEX "public"."${index}"`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "boite"`);
    }
  }
}
