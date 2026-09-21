import { MigrationInterface, QueryRunner } from 'typeorm';

const SLUG = 'b2-01-traitement-information-chiffree';
const VERSION = 3;
const ECRAN_MISSION = 'B2-01-A1-03-MISSION';
const ECRAN_TABLEAU = 'B2-01-A1-04-TABLEAU-DE-BORD';

const ANCIEN_GESTE =
  'Avant de calculer : dire ce que mesure chaque chiffre, vérifier qu’il est comparable, le recalculer, puis défendre une recommandation que le comité peut contrôler.';
const NOUVEAU_GESTE =
  'Avant de recommander un investissement, répondez à trois questions : que mesure chaque chiffre ? Les bases et les périodes sont-elles comparables ? Le recalcul confirme-t-il la recommandation ?';
const ANCIEN_SOUS_TITRE =
  'Version préparée par le service commercial, lundi 8 h 40.';
const NOUVEAU_SOUS_TITRE =
  'Avant de calculer, repérez pour chaque ligne ce qu’elle mesure, sa base et sa période.';

interface LigneCours {
  id: string;
}

interface LigneEcran {
  screen_id: string;
}

const DECLENCHEUR_ECRAN = [
  'ALTER TABLE "formation_screen_contents" DISABLE TRIGGER "trg_formation_screen_immutable"',
  'ALTER TABLE "formation_screen_contents" ENABLE TRIGGER "trg_formation_screen_immutable"',
] as const;

export class AlignB2CoursV3Presentation1789980000000 implements MigrationInterface {
  name = 'AlignB2CoursV3Presentation1789980000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.aligner(queryRunner, NOUVEAU_GESTE, NOUVEAU_SOUS_TITRE);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.aligner(queryRunner, ANCIEN_GESTE, ANCIEN_SOUS_TITRE);
  }

  private async aligner(
    queryRunner: QueryRunner,
    geste: string,
    sousTitre: string,
  ): Promise<void> {
    const cours = (await queryRunner.query(
      `SELECT "id" FROM "formation_course_contents" WHERE "slug" = $1 AND "version" = $2`,
      [SLUG, VERSION],
    )) as LigneCours[];
    if (cours.length !== 1) {
      throw new Error('Version B2 V3 introuvable ou non unique');
    }

    for (const sql of DECLENCHEUR_ECRAN.slice(0, 1)) {
      await queryRunner.query(sql);
    }
    try {
      await this.mettreAJourEcran(
        queryRunner,
        cours[0].id,
        ECRAN_MISSION,
        ['geste'],
        geste,
      );
      await this.mettreAJourEcran(
        queryRunner,
        cours[0].id,
        ECRAN_TABLEAU,
        ['presentation', 'props', 'subtitle'],
        sousTitre,
      );
    } finally {
      await queryRunner.query(DECLENCHEUR_ECRAN[1]);
    }
  }

  private async mettreAJourEcran(
    queryRunner: QueryRunner,
    coursId: string,
    screenId: string,
    chemin: string[],
    valeur: string,
  ): Promise<void> {
    const resultat = (await queryRunner.query(
      `UPDATE "formation_screen_contents"
       SET "proprietes" = jsonb_set("proprietes", $1::text[], to_jsonb($2::text), true)
       WHERE "course_id" = $3 AND "screen_id" = $4
       RETURNING "screen_id"`,
      [chemin, valeur, coursId, screenId],
    )) as unknown;
    const ecrans = (
      Array.isArray(resultat) && Array.isArray(resultat[0])
        ? resultat[0]
        : resultat
    ) as LigneEcran[];
    if (ecrans.length !== 1) {
      throw new Error(`Écran B2 V3 introuvable ou non unique : ${screenId}`);
    }
  }
}
