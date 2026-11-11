import { validArticleIngestEnvelope } from '../../../../../test/factories/article-ingest.factory';
import {
  ACCEPTEE_DES_DEUX_COTES,
  recitDuMatin,
  refuseeCommeParLeSchemaPartage,
  verdicts,
} from '../../../../../test/helpers/depot/schema-d-ingestion-partage';
import { ArticleContract } from './article-contract';

type Enveloppe = {
  schema_version: string;
  article: { sections: Record<string, unknown>[] };
};

describe('MB-24 · enveloppe 2.0 du récit du matin', () => {
  it('MB-24 · accepte le récit du matin, comme le schéma partagé avec le Pi', () => {
    expect(verdicts(recitDuMatin())).toEqual(ACCEPTEE_DES_DEUX_COTES);
  });

  refuseeCommeParLeSchemaPartage<Enveloppe>([
    [
      'un bloc d avant la refonte',
      (e: Enveloppe) => e.article.sections.push({ kind: 'radar' }),
    ],
    [
      'un sujet du jour absent',
      (e: Enveloppe) => e.article.sections.splice(1, 1),
    ],
    [
      'une image en http',
      (e: Enveloppe) => {
        e.article.sections[1].image = {
          url: 'http://cdn.meta.test/a.jpg',
          credit: 'X',
        };
      },
    ],
    [
      'une version de schéma inconnue',
      (e: Enveloppe) => (e.schema_version = '3.0'),
    ],
  ]);

  it('MB-24 · une enveloppe 1.0 du Pi pas encore mis à jour reste acceptée', () => {
    expect(ArticleContract.safeParse(validArticleIngestEnvelope).success).toBe(
      true,
    );
  });
});
