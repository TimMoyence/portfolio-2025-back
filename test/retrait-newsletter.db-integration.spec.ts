import { RetireLaNewsletter1792200000000 } from '../src/migrations/1792200000000-RetireLaNewsletter';
import {
  baseMigreeDeLaSuite,
  describeDb,
  jouerLaMigration,
  migrationsAnterieuresA,
  tablesPresentes,
} from './helpers/db-integration-datasource';

const TABLES_DE_LA_NEWSLETTER = [
  'article_broadcast_recipients',
  'article_broadcasts',
  'newsletter_subscribers',
];

describeDb(
  'Retrait de la newsletter et de la diffusion des articles sur une base migree',
  () => {
    const base = baseMigreeDeLaSuite(
      [],
      migrationsAnterieuresA('1792200000000-RetireLaNewsletter'),
    );

    const tablesDesArticles = () =>
      tablesPresentes(base(), ['articles', ...TABLES_DE_LA_NEWSLETTER]);

    it('supprime les abonnes et la diffusion des articles, et garde les articles', async () => {
      expect(await tablesDesArticles()).toEqual([
        'article_broadcast_recipients',
        'article_broadcasts',
        'articles',
        'newsletter_subscribers',
      ]);

      await jouerLaMigration(
        base(),
        new RetireLaNewsletter1792200000000(),
        'up',
      );

      expect(await tablesDesArticles()).toEqual(['articles']);
    });

    it('refuse de recreer la newsletter au retour arriere', async () => {
      await expect(
        new RetireLaNewsletter1792200000000().down(),
      ).rejects.toThrow(/definitif/);
      expect(await tablesDesArticles()).toEqual(['articles']);
    });
  },
);
