import { RequestMethod } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { appliquerLesTraitementsGlobaux } from '../src/common/interfaces/http/traitements-globaux';
import { ArticlesService } from '../src/modules/articles/application/articles.service';
import { PREFIXE_API_PAR_DEFAUT } from '../src/config/prefixe-api';
import { ArticleHmacGuard } from '../src/modules/articles/interfaces/article-hmac.guard';
import { ArticlesController } from '../src/modules/articles/interfaces/articles.controller';
import { createMockArticlesService } from './factories/article.factory';
import {
  ecouterEnBoucleLocale,
  fermerApplication,
  serveurHttpDe,
} from './helpers/nest-test-app';
import {
  REFUS_DE_L_OCTET_NUL,
  statutEtDetail,
} from './helpers/reponse-probleme';

describe('Articles HTTP aliases', () => {
  let app: INestApplication;
  const articles = createMockArticlesService();

  beforeAll(async () => {
    articles.listPublished.mockResolvedValue({ items: [], nextCursor: null });
    const moduleRef = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        { provide: ArticlesService, useValue: articles },
        ArticleHmacGuard,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    appliquerLesTraitementsGlobaux(app);
    app.setGlobalPrefix(PREFIXE_API_PAR_DEFAUT, {
      exclude: [
        { path: 'api/articles', method: RequestMethod.ALL },
        { path: 'api/articles/(.*)', method: RequestMethod.ALL },
      ],
    });
    await ecouterEnBoucleLocale(app);
  });

  afterAll(async () => {
    await fermerApplication(app);
  });

  it('serves the contract path used by the Raspberry Pi', async () => {
    await request(serveurHttpDe(app)).get('/api/articles').expect(200).expect({
      items: [],
      next_cursor: null,
    });
  });

  it('keeps the existing prefixed site API path', async () => {
    await request(serveurHttpDe(app))
      .get('/api/v1/portfolio25/articles')
      .expect(200)
      .expect({ items: [], next_cursor: null });
  });

  it('refuse en 400 un octet nul dans la requete, sans interroger les articles', async () => {
    articles.listPublished.mockClear();

    const reponse = await request(serveurHttpDe(app)).get(
      '/api/articles?tag=finance%00x',
    );

    expect(statutEtDetail(reponse)).toEqual(REFUS_DE_L_OCTET_NUL);
    expect(articles.listPublished).not.toHaveBeenCalled();
  });

  it('routes and protects the Raspberry Pi ingest endpoint', async () => {
    const response = await request(serveurHttpDe(app))
      .post('/api/articles/ingest')
      .send({});

    expect(response.status).toBe(401);
  });
});
