import { MigrationInterface, QueryRunner } from 'typeorm';
import { lireCoursStocke } from '../modules/formations/domain/cours/CoursStocke';
import { verifierStructure } from '../modules/formations/domain/cours/StructureCours';
import { B2_COURS } from './data/b2-v3.cours';

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
  const violations = verifierStructure(lireCoursStocke(B2_COURS));
  if (violations.length > 0) {
    const detail = violations
      .map(
        (violation) =>
          `${violation.regle} (${violation.ecran ?? 'cours'}) : ${violation.raison}`,
      )
      .join(' ; ');
    throw new Error(`Cours B2-01 refusé par la validation : ${detail}`);
  }
}

export class ReplaceB2Cours1790000000000 implements MigrationInterface {
  name = 'ReplaceB2Cours1790000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    validerLeCours();
    await this.verifierLesSeances(queryRunner);
    await this.supprimerLeContenuExistant(queryRunner);
    await this.insererLeCours(queryRunner);
    await this.publier(queryRunner);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.verifierLesSeances(queryRunner);
    await this.supprimerLeContenuExistant(queryRunner);
    await queryRunner.query(
      `DELETE FROM "formation_course_publications" WHERE "slug" = $1`,
      [B2_COURS.slug],
    );
  }

  private async verifierLesSeances(queryRunner: QueryRunner): Promise<void> {
    const lignes = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count" FROM "formation_sessions" WHERE "course_slug" = $1`,
      [B2_COURS.slug],
    )) as Compte[];
    if ((lignes[0]?.count ?? 0) > 0) {
      throw new Error(
        'Impossible de remplacer B2-01 : des séances existent déjà pour ce cours',
      );
    }
  }

  private async supprimerLeContenuExistant(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "formation_course_publications" WHERE "slug" = $1`,
      [B2_COURS.slug],
    );
    for (const [table, declencheur] of DECLENCHEURS) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DISABLE TRIGGER "${declencheur}"`,
      );
    }
    try {
      await queryRunner.query(
        `DELETE FROM "formation_course_contents" WHERE "slug" = $1`,
        [B2_COURS.slug],
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
        B2_COURS.slug,
        B2_COURS.version,
        B2_COURS.titre,
        B2_COURS.niveau,
        B2_COURS.dureeMinutes,
        JSON.stringify(B2_COURS.concepts),
        JSON.stringify(B2_COURS.remediations),
        JSON.stringify(B2_COURS.medias),
      ],
    )) as Ligne[];
    if (lignes.length === 0) {
      throw new Error('Le cours B2-01 n’a pas été inséré');
    }
    const coursId = lignes[0].id;

    for (const [position, ecran] of B2_COURS.ecrans.entries()) {
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

  private async publier(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "formation_course_publications" ("slug", "version_publiee", "publiee_le")
       VALUES ($1, $2, now())`,
      [B2_COURS.slug, B2_COURS.version],
    );
  }
}
