import { MigrationInterface, QueryRunner } from 'typeorm';
import { lireCoursStocke } from '../modules/formations/domain/cours/CoursStocke';
import { verifierStructure } from '../modules/formations/domain/cours/StructureCours';
import { B2_COURS_V3 } from './data/b2-v3.cours';

interface LigneDeCours {
  id: string;
}

interface Compte {
  count: number;
}

const TRIGGERS_D_IMMUTABILITE = [
  ['formation_screen_contents', 'trg_formation_screen_immutable'],
  ['formation_course_contents', 'trg_formation_course_immutable'],
] as const;

function validerLeContenu(): void {
  const violations = verifierStructure(lireCoursStocke(B2_COURS_V3));
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
      [B2_COURS_V3.slug, B2_COURS_V3.version],
    )) as LigneDeCours[];
    if (deja.length > 0) {
      return;
    }

    validerLeContenu();

    const inseres = (await queryRunner.query(
      `INSERT INTO "formation_course_contents"
         ("slug", "version", "titre", "niveau", "duree_minutes", "concepts", "remediations", "medias")
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb) RETURNING "id"`,
      [
        B2_COURS_V3.slug,
        B2_COURS_V3.version,
        B2_COURS_V3.titre,
        B2_COURS_V3.niveau,
        B2_COURS_V3.dureeMinutes,
        JSON.stringify(B2_COURS_V3.concepts),
        JSON.stringify(B2_COURS_V3.remediations),
        JSON.stringify(B2_COURS_V3.medias),
      ],
    )) as LigneDeCours[];
    const coursId = inseres[0].id;

    for (const [position, ecran] of B2_COURS_V3.ecrans.entries()) {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    const seances = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count" FROM "formation_sessions"
       WHERE "course_slug" = $1 AND "course_version" = $2`,
      [B2_COURS_V3.slug, B2_COURS_V3.version],
    )) as Compte[];
    if (seances[0].count > 0) {
      throw new Error(
        'Impossible de supprimer un contenu utilise par une seance',
      );
    }
    const publications = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count" FROM "formation_course_publications"
       WHERE "slug" = $1 AND "version_publiee" = $2`,
      [B2_COURS_V3.slug, B2_COURS_V3.version],
    )) as Compte[];
    if (publications[0].count > 0) {
      throw new Error('Impossible de supprimer un contenu publie');
    }

    for (const [table, declencheur] of TRIGGERS_D_IMMUTABILITE) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DISABLE TRIGGER "${declencheur}"`,
      );
    }
    try {
      await queryRunner.query(
        `DELETE FROM "formation_course_contents" WHERE "slug" = $1 AND "version" = $2`,
        [B2_COURS_V3.slug, B2_COURS_V3.version],
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
