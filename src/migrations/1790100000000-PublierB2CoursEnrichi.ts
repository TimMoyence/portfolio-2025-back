import { MigrationInterface, QueryRunner } from 'typeorm';
import { lireCoursStocke } from '../modules/formations/domain/cours/CoursStocke';
import { verifierStructure } from '../modules/formations/domain/cours/StructureCours';
import { B2_COURS } from './data/b2-v3.cours';
import { B2_COURS_ENRICHI } from './data/b2-enrichi.cours';

interface Ligne {
  id: string;
}

interface Compte {
  count: number;
}

const DECLENCHEURS = [
  ['formation_screen_contents', 'trg_formation_screen_immutable'],
  ['formation_course_contents', 'trg_formation_course_immutable'],
] as const;

function validerLeCours(): void {
  const violations = verifierStructure(lireCoursStocke(B2_COURS_ENRICHI));
  if (violations.length > 0) {
    const detail = violations
      .map(
        (violation) =>
          `${violation.regle} (${violation.ecran ?? 'cours'}) : ${violation.raison}`,
      )
      .join(' ; ');
    throw new Error(`Cours B2-01 enrichi refusé par la validation : ${detail}`);
  }
}

export class PublierB2CoursEnrichi1790100000000 implements MigrationInterface {
  name = 'PublierB2CoursEnrichi1790100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const deja = (await queryRunner.query(
      `SELECT "id" FROM "formation_course_contents" WHERE "slug" = $1 AND "version" = $2`,
      [B2_COURS_ENRICHI.slug, B2_COURS_ENRICHI.version],
    )) as Ligne[];
    if (deja.length === 0) {
      validerLeCours();
      await this.insererLeCours(queryRunner);
    }
    await this.publier(queryRunner, B2_COURS_ENRICHI.version);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const seances = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count" FROM "formation_sessions"
       WHERE "course_slug" = $1 AND "course_version" = $2`,
      [B2_COURS_ENRICHI.slug, B2_COURS_ENRICHI.version],
    )) as Compte[];
    if ((seances[0]?.count ?? 0) > 0) {
      throw new Error(
        `Impossible de retirer B2-01 enrichi : une séance sert la version ${B2_COURS_ENRICHI.version}`,
      );
    }
    await queryRunner.query(
      `UPDATE "formation_course_publications"
         SET "version_publiee" = $2, "publiee_le" = now(), "publiee_par" = NULL
       WHERE "slug" = $1 AND "version_publiee" = $3`,
      [B2_COURS.slug, B2_COURS.version, B2_COURS_ENRICHI.version],
    );
    for (const [table, declencheur] of DECLENCHEURS) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DISABLE TRIGGER "${declencheur}"`,
      );
    }
    try {
      await queryRunner.query(
        `DELETE FROM "formation_course_contents" WHERE "slug" = $1 AND "version" = $2`,
        [B2_COURS_ENRICHI.slug, B2_COURS_ENRICHI.version],
      );
    } finally {
      for (const [table, declencheur] of [...DECLENCHEURS].reverse()) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ENABLE TRIGGER "${declencheur}"`,
        );
      }
    }
  }

  private async insererLeCours(queryRunner: QueryRunner): Promise<void> {
    const lignes = (await queryRunner.query(
      `INSERT INTO "formation_course_contents"
       ("slug", "version", "titre", "niveau", "duree_minutes", "concepts", "remediations", "medias")
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb)
       RETURNING "id"`,
      [
        B2_COURS_ENRICHI.slug,
        B2_COURS_ENRICHI.version,
        B2_COURS_ENRICHI.titre,
        B2_COURS_ENRICHI.niveau,
        B2_COURS_ENRICHI.dureeMinutes,
        JSON.stringify(B2_COURS_ENRICHI.concepts),
        JSON.stringify(B2_COURS_ENRICHI.remediations),
        JSON.stringify(B2_COURS_ENRICHI.medias),
      ],
    )) as Ligne[];
    if (lignes.length === 0) {
      throw new Error('Le cours B2-01 enrichi n’a pas été inséré');
    }
    const coursId = lignes[0].id;

    for (const [position, ecran] of B2_COURS_ENRICHI.ecrans.entries()) {
      await queryRunner.query(
        `INSERT INTO "formation_screen_contents"
         ("course_id", "position", "screen_id", "titre", "diffusion", "brique", "duree_minutes", "concepts", "notes", "proprietes")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb)`,
        [
          coursId,
          position,
          ecran.screenId,
          ecran.titre,
          ecran.diffusion,
          ecran.brique,
          ecran.dureeMinutes,
          JSON.stringify(ecran.concepts),
          ecran.notes,
          JSON.stringify(ecran.proprietes),
        ],
      );
    }
  }

  private async publier(
    queryRunner: QueryRunner,
    version: number,
  ): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "formation_course_publications" ("slug", "version_publiee", "publiee_le")
       VALUES ($1, $2, now())
       ON CONFLICT ("slug") DO UPDATE
         SET "version_publiee" = EXCLUDED."version_publiee",
             "publiee_le" = EXCLUDED."publiee_le",
             "publiee_par" = NULL`,
      [B2_COURS_ENRICHI.slug, version],
    );
  }
}
