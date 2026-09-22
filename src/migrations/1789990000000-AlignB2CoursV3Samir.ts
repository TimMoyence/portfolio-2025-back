import { MigrationInterface, QueryRunner } from 'typeorm';

const SLUG = 'b2-01-traitement-information-chiffree';
const VERSION = 1;
const ECRAN = 'B2-01-A2-02-ORIGINE-AXE';

const ANCIEN = {
  titre: 'Déplacez l’origine de l’axe',
  definitionTitre:
    'Marge brute d’Atelier Rivage, 2022–2025 : déplacez l’origine et le haut de l’axe',
  source: 'Données fictives Atelier Rivage',
  description:
    'Courbe de la marge brute de 2022 à 2025 ; deux curseurs règlent le bas et le haut de l’axe vertical ; au départ, l’axe va de 284 000 € à 292 000 €, comme sur la diapositive de Samir.',
} as const;

const NOUVEAU = {
  titre: 'La diapositive de Samir — axe réglable',
  definitionTitre: 'Diapositive de Samir : marge brute et axe réglable',
  source: 'Service commercial d’Atelier Rivage (données fictives).',
  description:
    'Réglez l’origine et le haut de l’axe pour voir comment l’échelle transforme la lecture, sans changer les valeurs.',
} as const;

interface LigneCours {
  id: string;
}

interface LigneEcran {
  screen_id: string;
}

const DESACTIVER =
  'ALTER TABLE "formation_screen_contents" DISABLE TRIGGER "trg_formation_screen_immutable"';
const ACTIVER =
  'ALTER TABLE "formation_screen_contents" ENABLE TRIGGER "trg_formation_screen_immutable"';

export class AlignB2CoursV3Samir1789990000000 implements MigrationInterface {
  name = 'AlignB2CoursV3Samir1789990000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.aligner(queryRunner, NOUVEAU);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.aligner(queryRunner, ANCIEN);
  }

  private async aligner(
    queryRunner: QueryRunner,
    contenu: typeof NOUVEAU | typeof ANCIEN,
  ): Promise<void> {
    const cours = (await queryRunner.query(
      `SELECT "id" FROM "formation_course_contents" WHERE "slug" = $1 AND "version" = $2`,
      [SLUG, VERSION],
    )) as LigneCours[];
    if (cours.length !== 1) return;

    await queryRunner.query(DESACTIVER);
    try {
      const resultat = (await queryRunner.query(
        `UPDATE "formation_screen_contents"
         SET "titre" = $1,
             "proprietes" = jsonb_set(
               jsonb_set(
                 jsonb_set("proprietes", '{definition,titre}', to_jsonb($2::text), true),
                 '{definition,source}', to_jsonb($3::text), true
               ),
               '{definition,description}', to_jsonb($4::text), true
             )
         WHERE "course_id" = $5 AND "screen_id" = $6
         RETURNING "screen_id"`,
        [
          contenu.titre,
          contenu.definitionTitre,
          contenu.source,
          contenu.description,
          cours[0].id,
          ECRAN,
        ],
      )) as LigneEcran[];
      const ecrans = Array.isArray(resultat[0]) ? resultat[0] : resultat;
      if (ecrans.length !== 1) return;
    } finally {
      await queryRunner.query(ACTIVER);
    }
  }
}
