import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDatabase1763051251960 implements MigrationInterface {
    name = 'InitDatabase1763051251960'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "phone" character varying(30), "isActive" boolean NOT NULL DEFAULT true, "role" character varying(20) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_or_created_by" integer, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "service_faq_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "serviceFaqId" uuid NOT NULL, "locale" text NOT NULL, "slug" text NOT NULL, "question" text NOT NULL, "answer" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_or_created_by" integer, CONSTRAINT "uq_service_faq_locale_slug" UNIQUE ("locale", "slug"), CONSTRAINT "uq_service_faq_locale" UNIQUE ("serviceFaqId", "locale"), CONSTRAINT "PK_133739e73b1baa4aec9d0f247fc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_68a39c789c2aac991b008b9d69" ON "service_faq_translation" ("slug") `);
        await queryRunner.query(`CREATE TABLE "service_faq" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "serviceId" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_or_created_by" integer, CONSTRAINT "PK_8437b3cc22a06cea8c614c5586f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."services_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')`);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" text NOT NULL, "name" text NOT NULL, "icon" text, "status" "public"."services_status_enum" NOT NULL DEFAULT 'PUBLISHED', "order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_or_created_by" integer, CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_02cf0d0f46e11d22d952f62367" ON "services" ("slug") `);
        await queryRunner.query(`CREATE TABLE "services_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "serviceId" uuid NOT NULL, "locale" text NOT NULL, "slug" text NOT NULL, "title" text NOT NULL, "excerpt" text NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_or_created_by" integer, CONSTRAINT "uq_services_translation_locale_slug" UNIQUE ("locale", "slug"), CONSTRAINT "uq_services_translation_locale" UNIQUE ("serviceId", "locale"), CONSTRAINT "PK_0b9e93fadbed1ef7412d9153074" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e68047df3f25b9b42a9bdeb798" ON "services_translation" ("slug") `);
        await queryRunner.query(`CREATE TABLE "redirects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" text NOT NULL, "targetUrl" text NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "clicks" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_or_created_by" integer, CONSTRAINT "PK_d81f0797728eb0eb92ae3c6eedd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c4fe42e08ff15a0a69e594571f" ON "redirects" ("slug") `);
        await queryRunner.query(`CREATE TYPE "public"."projects_type_enum" AS ENUM('CLIENT', 'SIDE')`);
        await queryRunner.query(`CREATE TYPE "public"."projects_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" text NOT NULL, "type" "public"."projects_type_enum" NOT NULL DEFAULT 'SIDE', "repoUrl" text, "liveUrl" text, "coverImage" text, "gallery" text array, "stack" jsonb NOT NULL DEFAULT jsonb_build_array(), "status" "public"."projects_status_enum" NOT NULL DEFAULT 'PUBLISHED', "order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_or_created_by" integer, CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_96e045ab8b0271e5f5a91eae1e" ON "projects" ("slug") `);
        await queryRunner.query(`CREATE TABLE "project_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "locale" text NOT NULL, "slug" text NOT NULL, "title" text NOT NULL, "shortDescription" text, "longDescription" text, CONSTRAINT "uq_project_translation_locale_slug" UNIQUE ("locale", "slug"), CONSTRAINT "uq_project_translation_locale" UNIQUE ("projectId", "locale"), CONSTRAINT "PK_08fe426f8f10f6867cfccec3949" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5dff9dfa8b85b8bc95de44db8a" ON "project_translation" ("slug") `);
        await queryRunner.query(`CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" text NOT NULL, "title" text NOT NULL, "summary" text NOT NULL, "coverImage" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_or_created_by" integer, CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a3bb2d01cfa0f95bc5e034e1b7" ON "courses" ("slug") `);
        await queryRunner.query(`CREATE TABLE "courses_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "courseId" uuid NOT NULL, "locale" text NOT NULL, "slug" text NOT NULL, "title" text NOT NULL, "summary" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_or_created_by" integer, CONSTRAINT "uq_courses_translation_locale_slug" UNIQUE ("locale", "slug"), CONSTRAINT "uq_courses_translation_locale" UNIQUE ("courseId", "locale"), CONSTRAINT "PK_014a0caabbbc152723ca2eb7bca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c93c999705490b9c66c5a2898f" ON "courses_translation" ("slug") `);
        await queryRunner.query(`CREATE TYPE "public"."course_resource_kind_enum" AS ENUM('KAHOOT', 'MENTIMETER', 'SLIDES', 'PDF', 'LINK')`);
        await queryRunner.query(`CREATE TABLE "course_resource" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "courseId" uuid NOT NULL, "kind" "public"."course_resource_kind_enum" NOT NULL, "title" text NOT NULL, "url" text NOT NULL, "order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_or_created_by" integer, CONSTRAINT "PK_4f45a38d954c5a043e43273d965" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."contacts_status_enum" AS ENUM('NEW', 'READ', 'REPLIED', 'SPAM')`);
        await queryRunner.query(`CREATE TABLE "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requestId" uuid NOT NULL, "name" text NOT NULL, "email" text NOT NULL, "message" text NOT NULL, "status" "public"."contacts_status_enum" NOT NULL DEFAULT 'NEW', "ip" inet, "userAgent" text, "referer" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_or_created_by" integer, CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_45f21dedb6160198a548c8e335" ON "contacts" ("requestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_752866c5247ddd34fd05559537" ON "contacts" ("email") `);
        await queryRunner.query(`ALTER TABLE "service_faq_translation" ADD CONSTRAINT "FK_1c8722f404daf91feb09996f0e7" FOREIGN KEY ("serviceFaqId") REFERENCES "service_faq"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_faq" ADD CONSTRAINT "FK_a4ec6ae2e8e60e6914180b1629d" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "services_translation" ADD CONSTRAINT "FK_e6100306c0a6474b2838e34de9e" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_translation" ADD CONSTRAINT "FK_ee95925a28265d537be5bab3b6a" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "courses_translation" ADD CONSTRAINT "FK_91df5d79028aa74433042ee8ccc" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "course_resource" ADD CONSTRAINT "FK_7decc4cb7f7ae89b2991bb7b5cb" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course_resource" DROP CONSTRAINT "FK_7decc4cb7f7ae89b2991bb7b5cb"`);
        await queryRunner.query(`ALTER TABLE "courses_translation" DROP CONSTRAINT "FK_91df5d79028aa74433042ee8ccc"`);
        await queryRunner.query(`ALTER TABLE "project_translation" DROP CONSTRAINT "FK_ee95925a28265d537be5bab3b6a"`);
        await queryRunner.query(`ALTER TABLE "services_translation" DROP CONSTRAINT "FK_e6100306c0a6474b2838e34de9e"`);
        await queryRunner.query(`ALTER TABLE "service_faq" DROP CONSTRAINT "FK_a4ec6ae2e8e60e6914180b1629d"`);
        await queryRunner.query(`ALTER TABLE "service_faq_translation" DROP CONSTRAINT "FK_1c8722f404daf91feb09996f0e7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_752866c5247ddd34fd05559537"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_45f21dedb6160198a548c8e335"`);
        await queryRunner.query(`DROP TABLE "contacts"`);
        await queryRunner.query(`DROP TYPE "public"."contacts_status_enum"`);
        await queryRunner.query(`DROP TABLE "course_resource"`);
        await queryRunner.query(`DROP TYPE "public"."course_resource_kind_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c93c999705490b9c66c5a2898f"`);
        await queryRunner.query(`DROP TABLE "courses_translation"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a3bb2d01cfa0f95bc5e034e1b7"`);
        await queryRunner.query(`DROP TABLE "courses"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5dff9dfa8b85b8bc95de44db8a"`);
        await queryRunner.query(`DROP TABLE "project_translation"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_96e045ab8b0271e5f5a91eae1e"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."projects_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c4fe42e08ff15a0a69e594571f"`);
        await queryRunner.query(`DROP TABLE "redirects"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e68047df3f25b9b42a9bdeb798"`);
        await queryRunner.query(`DROP TABLE "services_translation"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_02cf0d0f46e11d22d952f62367"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP TYPE "public"."services_status_enum"`);
        await queryRunner.query(`DROP TABLE "service_faq"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_68a39c789c2aac991b008b9d69"`);
        await queryRunner.query(`DROP TABLE "service_faq_translation"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
