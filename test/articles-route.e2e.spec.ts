import { RequestMethod } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ArticlesService } from '../src/modules/articles/application/articles.service';
import { ArticleHmacGuard } from '../src/modules/articles/interfaces/article-hmac.guard';
import { ArticlesController } from '../src/modules/articles/interfaces/articles.controller';
import {
  ecouterEnBoucleLocale,
  fermerApplication,
  httpServerOf,
} from './helpers/nest-test-app';

describe('Articles HTTP aliases', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const articles = {
      listPublished: jest
        .fn()
        .mockResolvedValue({ items: [], nextCursor: null }),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        { provide: ArticlesService, useValue: articles },
        ArticleHmacGuard,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1/portfolio25', {
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
    await request(httpServerOf(app)).get('/api/articles').expect(200).expect({
      items: [],
      next_cursor: null,
    });
  });

  it('keeps the existing prefixed site API path', async () => {
    await request(httpServerOf(app))
      .get('/api/v1/portfolio25/articles')
      .expect(200)
      .expect({ items: [], next_cursor: null });
  });

  it('routes and protects the Raspberry Pi ingest endpoint', async () => {
    const response = await request(httpServerOf(app))
      .post('/api/articles/ingest')
      .send({});

    expect(response.status).toBe(401);
  });
});
