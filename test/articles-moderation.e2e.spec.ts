import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ArticleModerationService } from '../src/modules/articles/application/article-moderation.service';
import { ARTICLES_REPOSITORY } from '../src/modules/articles/application/articles.repository';
import { ArticlesService } from '../src/modules/articles/application/articles.service';
import { ArticleHmacGuard } from '../src/modules/articles/interfaces/article-hmac.guard';
import { ArticleModerationController } from '../src/modules/articles/interfaces/article-moderation.controller';
import { ArticlesController } from '../src/modules/articles/interfaces/articles.controller';
import { PREFIXE_API_PAR_DEFAUT } from '../src/config/prefixe-api';
import {
  ArticlesEnMemoire,
  buildArticleRecord,
} from './factories/article.factory';
import {
  applicationDeLaSuite,
  serveurHttpDe,
  ouvrirApplication,
  preparerChaqueRequete,
} from './helpers/nest-test-app';
import {
  REFUS_DE_L_OCTET_NUL,
  statutEtDetail,
} from './helpers/reponse-probleme';

const ARTICLE = buildArticleRecord();
const ARTICLE_ID = ARTICLE.articleId;

const vueDeModeration = (status: string) => ({
  article_id: ARTICLE_ID,
  slug: ARTICLE.slug,
  locale: ARTICLE.locale,
  title: ARTICLE.title,
  status,
  published_at: ARTICLE.publishedAt.toISOString(),
});

function ouvrirAvecLeRoleDeLEntete(moduleRef: TestingModule) {
  return ouvrirApplication(moduleRef, (application) => {
    application.setGlobalPrefix(PREFIXE_API_PAR_DEFAUT);
    preparerChaqueRequete(application, (req) => {
      const role = req.header('x-test-role');
      if (role) {
        (req as unknown as { user: unknown }).user = { roles: [role] };
      }
    });
  });
}

describe('Modération des articles (admin)', () => {
  const articles = new ArticlesEnMemoire();

  const app = applicationDeLaSuite(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ArticleModerationController],
      providers: [
        ArticleModerationService,
        { provide: ARTICLES_REPOSITORY, useValue: articles },
      ],
    }).compile();

    return ouvrirAvecLeRoleDeLEntete(moduleRef);
  });

  const serveur = () => serveurHttpDe(app());
  const statutEnBase = () => articles.articles.get(ARTICLE.id)?.status;
  const espionner = (methode: 'list' | 'withdraw' | 'restore') =>
    jest.spyOn(app().get(ArticleModerationService), methode);

  beforeEach(() => {
    jest.restoreAllMocks();
    articles.articles.clear();
    articles.articles.set(ARTICLE.id, buildArticleRecord());
  });

  it('refuse un utilisateur sans rôle admin', async () => {
    const list = espionner('list');

    await request(serveur())
      .get('/api/v1/portfolio25/articles/admin/articles')
      .set('x-test-role', 'user')
      .expect(403);

    expect(list).not.toHaveBeenCalled();
  });

  it('liste les articles pour un admin, chacun sous sa vue de modération', async () => {
    const response = await request(serveur())
      .get('/api/v1/portfolio25/articles/admin/articles')
      .set('x-test-role', 'admin');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([vueDeModeration('published')]);
  });

  it.each([
    ['withdraw', 'published', 'withdrawn'],
    ['restore', 'withdrawn', 'published'],
  ] as const)(
    'POST %s change le statut et rend la vue de modération',
    async (chemin, avant, apres) => {
      articles.articles.set(ARTICLE.id, buildArticleRecord({ status: avant }));

      await request(serveur())
        .post(`/api/v1/portfolio25/articles/admin/${ARTICLE_ID}/${chemin}`)
        .set('x-test-role', 'admin')
        .expect(200)
        .expect(vueDeModeration(apres));

      expect(statutEnBase()).toBe(apres);
    },
  );

  it('laisse le service seul juge de l identifiant ..%2Fetc', async () => {
    const withdraw = espionner('withdraw');

    await request(serveur())
      .post('/api/v1/portfolio25/articles/admin/..%2Fetc/withdraw')
      .set('x-test-role', 'admin')
      .expect(404);

    expect(withdraw).toHaveBeenCalledWith('../etc');
    expect(statutEnBase()).toBe('published');
  });

  it('refuse en 400 un identifiant qui porte un octet nul, sans interroger le service', async () => {
    const withdraw = espionner('withdraw');

    const reponse = await request(serveur())
      .post(`/api/v1/portfolio25/articles/admin/${ARTICLE_ID}%00/withdraw`)
      .set('x-test-role', 'admin');

    expect(statutEtDetail(reponse)).toEqual(REFUS_DE_L_OCTET_NUL);
    expect(withdraw).not.toHaveBeenCalled();
    expect(statutEnBase()).toBe('published');
  });
});

describe('État d une livraison d article (admin)', () => {
  const getDelivery = jest.fn();

  const app = applicationDeLaSuite(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [{ provide: ArticlesService, useValue: { getDelivery } }],
    })
      .overrideGuard(ArticleHmacGuard)
      .useValue({ canActivate: () => true })
      .compile();

    return ouvrirAvecLeRoleDeLEntete(moduleRef);
  });

  beforeEach(() => {
    getDelivery.mockReset().mockResolvedValue({
      deliveryId: 'mb-2026-10-22-fr',
      status: 'processed',
      articleId: ARTICLE_ID,
      attempts: 1,
      processedAt: null,
    });
  });

  it('refuse un compte sans rôle admin, sans interroger le service', async () => {
    await request(serveurHttpDe(app()))
      .get('/api/v1/portfolio25/articles/ingest/mb-2026-10-22-fr')
      .set('x-test-role', 'user')
      .expect(403);

    expect(getDelivery).not.toHaveBeenCalled();
  });

  it('rend l état de la livraison à un admin', async () => {
    const reponse = await request(serveurHttpDe(app()))
      .get('/api/v1/portfolio25/articles/ingest/mb-2026-10-22-fr')
      .set('x-test-role', 'admin')
      .expect(200);

    expect(reponse.body).toEqual({
      delivery_id: 'mb-2026-10-22-fr',
      status: 'processed',
      article_id: ARTICLE_ID,
      attempts: 1,
      processed_at: null,
    });
  });
});
