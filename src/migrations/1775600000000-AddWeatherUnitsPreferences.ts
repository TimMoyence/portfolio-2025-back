import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWeatherUnitsPreferences1775600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "weather_user_preferences" ADD "units" jsonb NOT NULL DEFAULT '{"temperature":"celsius","speed":"kmh","pressure":"hpa"}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "weather_user_preferences" DROP COLUMN "units"`,
    );
  }
}
