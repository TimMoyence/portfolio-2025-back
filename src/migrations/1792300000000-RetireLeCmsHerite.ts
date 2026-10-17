import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLES_DU_CMS_HERITE = [
  'service_faq_translation',
  'service_faq',
  'services_translation',
  'services',
  'project_translation',
  'projects',
  'courses_translation',
  'course_resource',
  'courses',
  'redirects',
];

const TYPES_DU_CMS_HERITE = [
  'course_resource_kind_enum',
  'projects_status_enum',
  'projects_type_enum',
  'services_status_enum',
];

export class RetireLeCmsHerite1792300000000 implements MigrationInterface {
  name = 'RetireLeCmsHerite1792300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES_DU_CMS_HERITE) {
      await queryRunner.query(`DROP TABLE "${table}"`);
    }
    for (const type of TYPES_DU_CMS_HERITE) {
      await queryRunner.query(`DROP TYPE "public"."${type}"`);
    }
  }

  public down(): Promise<void> {
    return Promise.reject(
      new Error(
        'Retrait definitif du CMS herite : projets, services, cours et redirections ne sont plus servis.',
      ),
    );
  }
}
