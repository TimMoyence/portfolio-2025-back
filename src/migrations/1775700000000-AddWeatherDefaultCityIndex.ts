import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWeatherDefaultCityIndex1775700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "weather_user_preferences"
      ADD COLUMN "default_city_index" integer DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "weather_user_preferences"
      DROP COLUMN "default_city_index"
    `);
  }
}
