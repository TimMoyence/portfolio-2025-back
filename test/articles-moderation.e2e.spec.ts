import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { ArticleModerationService } from '../src/modules/articles/application/article-moderation.service';
import { ArticleModerationController } from '../src/modules/articles/interfaces/article-moderation.controller';
import {
  ecouterEnBoucleLocale,
  fermerApplication,
  httpServerOf,
} from './helpers/nest-test-app';

const ARTICLE_ID = 'morning-brief-2026-09-23-fr';

describe('Modération des articles (admin)', () => {
  let app: INestApplication;
  const moderation = {
    list: jest.fn().mockResolvedValue([]),
    withdraw: jest.fn().mockResolvedValue({ article_id: ARTICLE_ID }),
    restore: jest.fn().mockResolvedValue({ article_id: ARTICLE_ID }),
    approveBroadcast: jest.fn().mockResolvedValue({ article_id: ARTICLE_ID }),
    cancelBroadcast: jest.fn().mockResolvedValue({ article_id: ARTICLE_ID }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ArticleModerationController],
      providers: [{ provide: ArticleModerationService, useValue: moderation }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const role = req.header('x-test-role');
      if (role) {
        (req as unknown as { user: unknown }).user = { roles: [role] };
      }
      next();
    });
    app.setGlobalPrefix('api/v1/portfolio25');
    await ecouterEnBoucleLocale(app);
  });

  afterAll(async () => {
    await fermerApplication(app);
  });

  beforeEach(() => jest.clearAllMocks());

  it('refuse un utilisateur sans rôle admin', async () => {
    await request(httpServerOf(app))
      .get('/api/v1/portfolio25/articles/admin/articles')
      .set('x-test-role', 'user')
      .expect(403);

    expect(moderation.list).not.toHaveBeenCalled();
  });

  it('liste les articles pour un admin', async () => {
    const response = await request(httpServerOf(app))
      .get('/api/v1/portfolio25/articles/admin/articles')
      .set('x-test-role', 'admin');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(moderation.list).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['withdraw', 'withdraw'],
    ['restore', 'restore'],
    ['broadcast/approve', 'approveBroadcast'],
    ['broadcast/cancel', 'cancelBroadcast'],
  ] as const)('route POST %s vers le service', async (path, method) => {
    await request(httpServerOf(app))
      .post(`/api/v1/portfolio25/articles/admin/${ARTICLE_ID}/${path}`)
      .set('x-test-role', 'admin')
      .expect(200)
      .expect({ article_id: ARTICLE_ID });

    expect(moderation[method]).toHaveBeenCalledWith(ARTICLE_ID);
  });

  it('répond 404 sans appeler le service pour un identifiant hors contrat', async () => {
    await request(httpServerOf(app))
      .post('/api/v1/portfolio25/articles/admin/..%2Fetc/withdraw')
      .set('x-test-role', 'admin')
      .expect(404);

    expect(moderation.withdraw).not.toHaveBeenCalled();
  });
});
