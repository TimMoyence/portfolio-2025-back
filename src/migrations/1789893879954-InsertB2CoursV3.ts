import { MigrationInterface, QueryRunner } from 'typeorm';
import { lireCoursStocke } from '../modules/formations/domain/cours/CoursStocke';
import { verifierStructure } from '../modules/formations/domain/cours/StructureCours';
import { B2_COURS } from './data/b2-v3.cours';

interface LigneDeCours {
  id: string;
}

interface Compte {
  count: number;
}

interface VersionRestante {
  version: number | null;
}

const TRIGGERS_D_IMMUTABILITE = [
  ['formation_screen_contents', 'trg_formation_screen_immutable'],
  ['formation_course_contents', 'trg_formation_course_immutable'],
] as const;

function validerLeContenu(): void {
  const violations = verifierStructure(lireCoursStocke(B2_COURS));
  if (violations.length > 0) {
    const detail = violations
      .map(
        (violation) =>
          `${violation.regle} (${violation.ecran ?? 'cours'}) : ${violation.raison}`,
      )
      .join(' ; ');
    throw new Error(
      `Contenu B2-01 V3 refuse par la validation du domaine : ${detail}`,
    );
  }
}

export class InsertB2CoursV31789893879954 implements MigrationInterface {
  name = 'InsertB2CoursV31789893879954';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const deja = (await queryRunner.query(
      `SELECT "id" FROM "formation_course_contents" WHERE "slug" = $1 AND "version" = $2`,
      [B2_COURS.slug, B2_COURS.version],
    )) as LigneDeCours[];
    if (deja.length > 0) {
      await this.publier(queryRunner);
      return;
    }

    validerLeContenu();

    const inseres = (await queryRunner.query(
      `INSERT INTO "formation_course_contents"
         ("slug", "version", "titre", "niveau", "duree_minutes", "concepts", "remediations", "medias")
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb) RETURNING "id"`,
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
    )) as LigneDeCours[];
    const coursId = inseres[0].id;

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

    await this.publier(queryRunner);
  }

  private async publier(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "formation_course_publications" ("slug", "version_publiee", "publiee_le")
       VALUES ($1, $2, now())
       ON CONFLICT ("slug") DO UPDATE
         SET "version_publiee" = EXCLUDED."version_publiee",
             "publiee_le" = EXCLUDED."publiee_le",
             "publiee_par" = NULL`,
      [B2_COURS.slug, B2_COURS.version],
    );
  }

  private async republierLaVersionPrecedente(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const restantes = (await queryRunner.query(
      `SELECT MAX("version")::int AS "version" FROM "formation_course_contents"
       WHERE "slug" = $1 AND "version" <> $2`,
      [B2_COURS.slug, B2_COURS.version],
    )) as VersionRestante[];
    const precedente = restantes[0]?.version ?? null;
    if (precedente === null) {
      await queryRunner.query(
        `DELETE FROM "formation_course_publications" WHERE "slug" = $1`,
        [B2_COURS.slug],
      );
      return;
    }
    await queryRunner.query(
      `UPDATE "formation_course_publications"
         SET "version_publiee" = $2, "publiee_le" = now(), "publiee_par" = NULL
       WHERE "slug" = $1`,
      [B2_COURS.slug, precedente],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const seances = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count" FROM "formation_sessions"
       WHERE "course_slug" = $1 AND "course_version" = $2`,
      [B2_COURS.slug, B2_COURS.version],
    )) as Compte[];
    if (seances[0].count > 0) {
      throw new Error(
        'Impossible de supprimer un contenu utilise par une seance',
      );
    }
    await this.republierLaVersionPrecedente(queryRunner);

    for (const [table, declencheur] of TRIGGERS_D_IMMUTABILITE) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DISABLE TRIGGER "${declencheur}"`,
      );
    }
    try {
      await queryRunner.query(
        `DELETE FROM "formation_course_contents" WHERE "slug" = $1 AND "version" = $2`,
        [B2_COURS.slug, B2_COURS.version],
      );
    } finally {
      for (const [table, declencheur] of [
        ...TRIGGERS_D_IMMUTABILITE,
      ].reverse()) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ENABLE TRIGGER "${declencheur}"`,
        );
      }
    }
  }
}
