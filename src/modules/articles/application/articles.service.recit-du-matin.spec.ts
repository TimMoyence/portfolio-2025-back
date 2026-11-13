import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createMockArticlesRepositorySansLivraison } from '../../../../test/factories/diffusion/article.factory';
import { validArticleIngestEnvelope } from '../../../../test/factories/diffusion/article-ingest.factory';
import { RACINE } from '../../../../test/helpers/depot/racine';
import { ArticlesService } from './articles.service';

const RECIT = JSON.parse(
  readFileSync(
    join(RACINE, 'test/fixtures/articles/enveloppe-recit-du-matin.json'),
    'utf8',
  ),
) as { article: { sections: unknown[]; sources: unknown[] } };

async function stocker(enveloppe: unknown) {
  const repository = createMockArticlesRepositorySansLivraison();
  await new ArticlesService(repository).ingest(enveloppe, 'cle-1', 'nonce-1');
  return repository.saveArticleAndDelivery.mock.calls[0][0];
}

describe('MB-24 · stockage d une édition reçue', () => {
  it('MB-24 · une enveloppe 1.0 est stockée en texte suivi, sans rien inventer', async () => {
    const article = await stocker(validArticleIngestEnvelope);
    expect(article.sections).toEqual([]);
    expect(article.contentMarkdown).toBe(
      validArticleIngestEnvelope.article.content_markdown,
    );
    expect(article.sources).toEqual([
      { nom: 'Source', url: 'https://example.com/source', publie_le: null },
    ]);
    expect(article.provenance).toEqual({
      run_id: 'morning-brief-2026-09-09-fr',
      edition_date: '2026-09-09',
      content_sha256:
        validArticleIngestEnvelope.article.provenance.content_sha256,
    });
  });

  it('MB-24 · une enveloppe 2.0 garde ses sections typées et ses sources', async () => {
    const article = await stocker(RECIT);
    expect(article.sections).toEqual(RECIT.article.sections);
    expect(article.sources).toEqual(RECIT.article.sources);
  });
});
