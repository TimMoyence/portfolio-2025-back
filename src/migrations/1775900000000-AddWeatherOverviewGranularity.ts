import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWeatherOverviewGranularity1775900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "weather_user_preferences" ADD COLUMN "overview_granularity" VARCHAR(5) NOT NULL DEFAULT 'day'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "weather_user_preferences" DROP COLUMN "overview_granularity"`,
    );
  }
}
