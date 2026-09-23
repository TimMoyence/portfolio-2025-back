import { ArticleContract } from './article-contract';
import { validArticleIngestEnvelope } from '../testing/article-ingest.fixture';

describe('ArticleContract', () => {
  it('normalise une enveloppe publiée et vérifie le hash du Markdown', () => {
    expect(ArticleContract.parse(validArticleIngestEnvelope).article.slug).toBe(
      'morning-brief-2026-09-09',
    );
  });

  it('refuse une URL non HTTP(S)', () => {
    expect(() => ArticleContract.parse({})).toThrow();
  });

  it.each(['-ab', 'a', 'a'.repeat(81), 'Ab', 'a_b'])(
    'refuse un section.id hors du motif du producteur (%s)',
    (id) => {
      const payload = structuredClone(validArticleIngestEnvelope);
      payload.article.sections[0].id = id;

      expect(ArticleContract.safeParse(payload).success).toBe(false);
    },
  );

  it.each(['ab', '0-', 'a'.repeat(80), 'radar-2'])(
    'accepte un section.id conforme au motif du producteur (%s)',
    (id) => {
      const payload = structuredClone(validArticleIngestEnvelope);
      payload.article.sections[0].id = id;

      expect(ArticleContract.safeParse(payload).success).toBe(true);
    },
  );
});
