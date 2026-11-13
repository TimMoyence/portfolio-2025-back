import { ArticleContract } from './article-contract';
import { validArticleIngestEnvelope } from '../../../../../test/factories/diffusion/article-ingest.factory';

describe('ArticleContract', () => {
  it('normalise une enveloppe publiée et vérifie le hash du Markdown', () => {
    expect(ArticleContract.parse(validArticleIngestEnvelope).article.slug).toBe(
      'morning-brief-2026-09-09',
    );
  });

  it('refuse une enveloppe vide', () => {
    expect(() => ArticleContract.parse({})).toThrow();
  });

  it('refuse une enveloppe 1.0 dont le Markdown ne correspond plus à son empreinte', () => {
    const payload = structuredClone(validArticleIngestEnvelope);
    payload.article.content_markdown += ' modifié';
    expect(ArticleContract.safeParse(payload).success).toBe(false);
  });
});
