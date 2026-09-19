import { MigrationInterface, QueryRunner } from 'typeorm';

const COURSE_ID = '00000000-0000-4000-8000-000000000201';

const SLIDE_IDS = [
  'B2-01-S01-ACCROCHE',
  'B2-01-S02-CONTRAT',
  'B2-01-S03-PREDICTION',
  'B2-01-S04-AXES',
  'B2-01-S05-ANATOMIE',
  'B2-01-S06-HABILLER',
  'B2-01-S07-COMPATIBILITE',
  'B2-01-S08-UNITES',
  'B2-01-S09-FONDATIONS',
  'B2-01-S10-CONTROLEUR',
  'B2-01-S11-C1',
  'B2-01-S12-ABSOLU-RELATIF',
  'B2-01-S13-FORMULE',
  'B2-01-S14-CALCUL',
  'B2-01-S15-BASE',
  'B2-01-S16-POINTS',
  'B2-01-S17-HAUSSE-BAISSE',
  'B2-01-S18-COEFFICIENTS',
  'B2-01-S19-SUCCESSIVES',
  'B2-01-S20-HISTOIRE',
  'B2-01-S21-METHODE',
  'B2-01-S22-C2',
  'B2-01-S23-INFLATION',
  'B2-01-S24-SOURCE-INFLATION',
  'B2-01-S25-DESINFLATION',
  'B2-01-S26-RYTHME',
  'B2-01-S27-INDICE',
  'B2-01-S28-CONCLUSION-INFLATION',
  'B2-01-S29-PAUSE',
  'B2-01-S30-PLAYFAIR',
  'B2-01-S31-RELECTURE',
  'B2-01-S32-AMPLITUDE',
  'B2-01-S33-FORME',
  'B2-01-S34-TITRE',
  'B2-01-S35-CORRELATION',
  'B2-01-S36-NIGHTINGALE',
  'B2-01-S37-AUDIT-GRAPHIQUE',
  'B2-01-S38-MIX',
  'B2-01-S39-PREVISION-MIX',
  'B2-01-S40-PONDEREE',
  'B2-01-S41-SIMULATEUR-MIX',
  'B2-01-S42-VALEUR-TAUX',
  'B2-01-S43-MARGE-2024',
  'B2-01-S44-MARGE-2025',
  'B2-01-S45-RECOMMANDATION',
  'B2-01-S46-VOTE-1',
  'B2-01-S47-PAIRS',
  'B2-01-S48-VOTE-2',
  'B2-01-S49-DEBRIEF',
  'B2-01-S50-PACIOLI',
  'B2-01-S51-MISSION',
  'B2-01-S52-CONTROLE-GLOBAL',
  'B2-01-S53-LOCALISER',
  'B2-01-S54-MULTIPLE-NEUF',
  'B2-01-S55-F004',
  'B2-01-S56-TVA',
  'B2-01-S57-COMPENSATION',
  'B2-01-S58-ALERTE',
  'B2-01-S59-DEFI',
  'B2-01-S60-PRIORITES',
  'B2-01-S61-CONTROLE',
  'B2-01-S62-DECISION',
  'B2-01-S63-FLASH-POINTS',
  'B2-01-S64-FLASH-PREUVE',
  'B2-01-S65-MAITRISE',
  'B2-01-S66-SORTIE',
  'B2-01-S67-BOITE-A-OUTILS',
  'B2-01-S68-TABLEUR-BI',
  'B2-01-S69-FORMULES',
  'B2-01-S70-IA-CONTROLE',
  'B2-01-S71-SKILLS-IA',
  'B2-01-S72-RESSOURCES',
] as const;

export class AlignB2SessionDeck1779300000000 implements MigrationInterface {
  name = 'AlignB2SessionDeck1779300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "formation_course_contents" SET "duree_minutes" = $1 WHERE "id" = $2`,
      [210, COURSE_ID],
    );
    await queryRunner.query(
      `DELETE FROM "formation_screen_contents" WHERE "course_id" = $1`,
      [COURSE_ID],
    );

    for (const [position, screenId] of SLIDE_IDS.entries()) {
      await queryRunner.query(
        `INSERT INTO "formation_screen_contents" ("course_id", "position", "screen_id", "brique", "duree_minutes", "concepts", "notes", "proprietes") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          COURSE_ID,
          position,
          screenId,
          'fp-story',
          3,
          JSON.stringify(['proportion']),
          '',
          JSON.stringify({
            titre: screenId,
            paragraphes: ['Contenu visuel servi par le deck B2 partagé.'],
          }),
        ],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "formation_screen_contents" WHERE "course_id" = $1`,
      [COURSE_ID],
    );
    await queryRunner.query(
      `UPDATE "formation_course_contents" SET "duree_minutes" = $1 WHERE "id" = $2`,
      [70, COURSE_ID],
    );
  }
}
