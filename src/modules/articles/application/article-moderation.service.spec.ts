import { ResourceNotFoundError } from '../../../common/domain/errors/ResourceNotFoundError';
import {
  ArticlesEnMemoire,
  buildArticleRecord,
} from '../../../../test/factories/article.factory';
import { ArticleModerationService } from './article-moderation.service';

const ARTICLE_ID = 'morning-brief-2026-09-23-fr';

function setup() {
  const store = new ArticlesEnMemoire();
  store.articles.set('record-1', buildArticleRecord());
  return { store, moderation: new ArticleModerationService(store) };
}

describe('ArticleModerationService', () => {
  it('retire un article du site', async () => {
    const { store, moderation } = setup();

    const result = await moderation.withdraw(ARTICLE_ID);

    expect(store.articles.get('record-1')?.status).toBe('withdrawn');
    expect(result).toMatchObject({
      article_id: ARTICLE_ID,
      status: 'withdrawn',
    });
  });

  it('republie un article retiré', async () => {
    const { store, moderation } = setup();
    await moderation.withdraw(ARTICLE_ID);

    const result = await moderation.restore(ARTICLE_ID);

    expect(store.articles.get('record-1')?.status).toBe('published');
    expect(result).toMatchObject({
      article_id: ARTICLE_ID,
      status: 'published',
    });
  });

  it('répond 404 pour un article inconnu', async () => {
    const { moderation } = setup();

    await expect(
      moderation.withdraw('morning-brief-2020-01-01-fr'),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('répond 404 sans interroger la base pour un identifiant hors contrat', async () => {
    const { store, moderation } = setup();
    const lecture = jest.spyOn(store, 'findByArticleId');

    await expect(
      moderation.withdraw(`${ARTICLE_ID}\u0000`),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    expect(lecture).not.toHaveBeenCalled();
  });

  it('liste les derniers articles avec leur statut', async () => {
    const { moderation } = setup();

    await expect(moderation.list()).resolves.toEqual([
      {
        article_id: ARTICLE_ID,
        slug: 'morning-brief-2026-09-23',
        locale: 'fr',
        title: 'Veille IA du 23 septembre',
        status: 'published',
        published_at: '2026-09-23T04:15:00.000Z',
      },
    ]);
  });
});
