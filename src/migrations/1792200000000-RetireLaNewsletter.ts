import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLES_DE_LA_NEWSLETTER = [
  'article_broadcast_recipients',
  'article_broadcasts',
  'newsletter_subscribers',
];

export class RetireLaNewsletter1792200000000 implements MigrationInterface {
  name = 'RetireLaNewsletter1792200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES_DE_LA_NEWSLETTER) {
      await queryRunner.query(`DROP TABLE "${table}"`);
    }
  }

  public down(): Promise<void> {
    return Promise.reject(
      new Error(
        'Retrait definitif de la newsletter : ni abonnes ni diffusion des articles ne sont plus servis.',
      ),
    );
  }
}
