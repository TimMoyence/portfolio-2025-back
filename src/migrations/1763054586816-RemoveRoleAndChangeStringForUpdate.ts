import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveRoleAndChangeStringForUpdate1763054586816 implements MigrationInterface {
    name = 'RemoveRoleAndChangeStringForUpdate1763054586816'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_or_created_by" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "services_translation" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "services_translation" ADD "updated_or_created_by" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "services" ADD "updated_or_created_by" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "service_faq_translation" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "service_faq_translation" ADD "updated_or_created_by" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "service_faq" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "service_faq" ADD "updated_or_created_by" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "redirects" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "redirects" ADD "updated_or_created_by" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "updated_or_created_by" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "courses_translation" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "courses_translation" ADD "updated_or_created_by" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "updated_or_created_by" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "course_resource" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "course_resource" ADD "updated_or_created_by" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD "updated_or_created_by" character varying(50)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD "updated_or_created_by" integer`);
        await queryRunner.query(`ALTER TABLE "course_resource" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "course_resource" ADD "updated_or_created_by" integer`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "updated_or_created_by" integer`);
        await queryRunner.query(`ALTER TABLE "courses_translation" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "courses_translation" ADD "updated_or_created_by" integer`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "updated_or_created_by" integer`);
        await queryRunner.query(`ALTER TABLE "redirects" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "redirects" ADD "updated_or_created_by" integer`);
        await queryRunner.query(`ALTER TABLE "service_faq" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "service_faq" ADD "updated_or_created_by" integer`);
        await queryRunner.query(`ALTER TABLE "service_faq_translation" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "service_faq_translation" ADD "updated_or_created_by" integer`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "services" ADD "updated_or_created_by" integer`);
        await queryRunner.query(`ALTER TABLE "services_translation" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "services_translation" ADD "updated_or_created_by" integer`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_or_created_by"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_or_created_by" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying(20) NOT NULL`);
    }

}
