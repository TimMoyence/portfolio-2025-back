import type { Response } from 'express';
import {
  buildArticleRecord,
  createMockArticlesService,
} from '../../../../test/factories/article.factory';
import { ArticlesController } from './articles.controller';

function controleurAvec(
  articles: ReturnType<typeof createMockArticlesService>,
) {
  return new ArticlesController(articles as never);
}

describe('ArticlesController — langue demandée', () => {
  it.each([
    ['en', 'en'],
    ['en-US', 'en'],
    [' EN ', 'en'],
    ['fr-FR', 'fr'],
    ['de', 'fr'],
  ])(
    'lit un article demandé en %p dans la langue %p',
    async (demandee, servie) => {
      const articles = createMockArticlesService();
      articles.getPublishedBySlug.mockResolvedValue(buildArticleRecord());

      await controleurAvec(articles).getBySlug('veille', demandee);

      expect(articles.getPublishedBySlug).toHaveBeenCalledWith(
        'veille',
        servie,
      );
    },
  );

  it('sert le flux RSS dans la langue normalisée', async () => {
    const articles = createMockArticlesService();
    articles.feed.mockResolvedValue('<rss/>');
    const reponse = { type: jest.fn().mockReturnThis(), send: jest.fn() };

    await controleurAvec(articles).feed(
      'en-GB',
      reponse as unknown as Response,
    );

    expect(articles.feed).toHaveBeenCalledWith('en');
  });
});
