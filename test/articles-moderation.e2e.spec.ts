import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ArticleModerationService } from '../src/modules/articles/application/article-moderation.service';
import { ArticleModerationController } from '../src/modules/articles/interfaces/article-moderation.controller';
import { PREFIXE_API_PAR_DEFAUT } from '../src/config/prefixe-api';
import { ResourceNotFoundError } from '../src/common/domain/errors/ResourceNotFoundError';
import { AllExceptionsFilter } from '../src/common/interfaces/filters/all-exceptions.filter';
import { DomainExceptionFilter } from '../src/common/interfaces/filters/DomainExceptionFilter';
import {
  applicationDeLaSuite,
  httpServerOf,
  ouvrirApplication,
  preparerChaqueRequete,
} from './helpers/nest-test-app';

const ARTICLE_ID = 'morning-brief-2026-09-23-fr';

describe('Modération des articles (admin)', () => {
  const moderation = {
    list: jest.fn().mockResolvedValue([]),
    withdraw: jest.fn().mockResolvedValue({ article_id: ARTICLE_ID }),
    restore: jest.fn().mockResolvedValue({ article_id: ARTICLE_ID }),
    approveBroadcast: jest.fn().mockResolvedValue({ article_id: ARTICLE_ID }),
    cancelBroadcast: jest.fn().mockResolvedValue({ article_id: ARTICLE_ID }),
  };

  const app = applicationDeLaSuite(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ArticleModerationController],
      providers: [{ provide: ArticleModerationService, useValue: moderation }],
    }).compile();

    return ouvrirApplication(moduleRef, (application) => {
      preparerChaqueRequete(application, (req) => {
        const role = req.header('x-test-role');
        if (role) {
          (req as unknown as { user: unknown }).user = { roles: [role] };
        }
      });
      application.useGlobalFilters(
        new AllExceptionsFilter(),
        new DomainExceptionFilter(),
      );
      application.setGlobalPrefix(PREFIXE_API_PAR_DEFAUT);
    });
  });

  const serveur = () => httpServerOf(app());

  beforeEach(() => jest.clearAllMocks());

  it('refuse un utilisateur sans rôle admin', async () => {
    await request(serveur())
      .get('/api/v1/portfolio25/articles/admin/articles')
      .set('x-test-role', 'user')
      .expect(403);

    expect(moderation.list).not.toHaveBeenCalled();
  });

  it('liste les articles pour un admin', async () => {
    const response = await request(serveur())
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
    await request(serveur())
      .post(`/api/v1/portfolio25/articles/admin/${ARTICLE_ID}/${path}`)
      .set('x-test-role', 'admin')
      .expect(200)
      .expect({ article_id: ARTICLE_ID });

    expect(moderation[method]).toHaveBeenCalledWith(ARTICLE_ID);
  });

  it.each([
    ['..%2Fetc', '../etc'],
    [`${ARTICLE_ID}%00`, `${ARTICLE_ID}\u0000`],
  ])(
    'laisse le service seul juge de l identifiant %s',
    async (segment, identifiant) => {
      moderation.withdraw.mockRejectedValueOnce(
        new ResourceNotFoundError('Article not found'),
      );

      await request(serveur())
        .post(`/api/v1/portfolio25/articles/admin/${segment}/withdraw`)
        .set('x-test-role', 'admin')
        .expect(404);

      expect(moderation.withdraw).toHaveBeenCalledWith(identifiant);
    },
  );
});
