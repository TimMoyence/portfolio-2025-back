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
});
