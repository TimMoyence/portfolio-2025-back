import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { IS_PUBLIC_KEY } from '../src/common/interfaces/auth/public.decorator';
import { ConfirmSubscriptionUseCase } from '../src/modules/newsletter/application/ConfirmSubscription.useCase';
import { SubscribeNewsletterUseCase } from '../src/modules/newsletter/application/SubscribeNewsletter.useCase';
import { UnsubscribeNewsletterUseCase } from '../src/modules/newsletter/application/UnsubscribeNewsletter.useCase';
import { NewsletterController } from '../src/modules/newsletter/interfaces/Newsletter.controller';
import { buildNewsletterSubscriber } from './factories/newsletter-subscriber.factory';

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });

jest.mock('../src/common/infrastructure/mail/smtp-transporter.util', () => ({
  createOptionalSmtpTransporter: jest.fn(() => ({ sendMail: mockSendMail })),
}));

import { NewsletterMailerService } from '../src/modules/newsletter/infrastructure/NewsletterMailer.service';

const API_PREFIX = 'api/v1/portfolio25';
const VALID_TOKEN = '550e8400-e29b-41d4-a716-446655440000';

@Injectable()
class PublicOnlyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    throw new UnauthorizedException();
  }
}

/**
 * Filet de securite sur le desabonnement en un clic (RFC 8058).
 *
 * Les specs unitaires appellent les methodes du controleur en direct :
 * elles ne traversent ni le routage, ni le prefixe global, ni les
 * guards. Retirer `@Post('unsubscribe')` les laissait donc toutes
 * vertes alors que la route n'existait plus. Ces tests montent une
 * vraie application HTTP pour fermer cet angle mort.
 */
describe('Desabonnement newsletter (e2e http socket)', () => {
  let app: INestApplication;

  const unsubscribeUseCase = { execute: jest.fn() };
  const subscribeUseCase = { execute: jest.fn() };
  const confirmUseCase = { execute: jest.fn() };

  const getHttpServer = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NewsletterController],
      providers: [
        { provide: SubscribeNewsletterUseCase, useValue: subscribeUseCase },
        { provide: ConfirmSubscriptionUseCase, useValue: confirmUseCase },
        { provide: UnsubscribeNewsletterUseCase, useValue: unsubscribeUseCase },
        { provide: APP_GUARD, useClass: PublicOnlyGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(API_PREFIX);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    unsubscribeUseCase.execute.mockResolvedValue({
      status: 'unsubscribed',
      alreadyUnsubscribed: false,
    });
  });

  it('expose POST /newsletter/unsubscribe derriere le prefixe d’API', async () => {
    const response = await request(getHttpServer())
      .post(`/${API_PREFIX}/newsletter/unsubscribe`)
      .query({ token: VALID_TOKEN })
      .expect(200);

    expect(response.body).toEqual({ status: 'unsubscribed' });
  });

  it('accepte le POST tel que Gmail l’emet (form-urlencoded, sans authentification)', async () => {
    await request(getHttpServer())
      .post(`/${API_PREFIX}/newsletter/unsubscribe`)
      .query({ token: VALID_TOKEN })
      .type('form')
      .send('List-Unsubscribe=One-Click')
      .expect(200);

    expect(unsubscribeUseCase.execute).toHaveBeenCalledWith(VALID_TOKEN, {
      sendAck: false,
    });
  });

  it('ne demande jamais d’authentification sur le desabonnement', async () => {
    const response = await request(getHttpServer())
      .post(`/${API_PREFIX}/newsletter/unsubscribe`)
      .query({ token: VALID_TOKEN });

    expect(response.status).not.toBe(401);
  });

  it('repond 404 sur un token malforme, sans appeler le use case', async () => {
    await request(getHttpServer())
      .post(`/${API_PREFIX}/newsletter/unsubscribe`)
      .query({ token: 'pas-un-uuid' })
      .expect(404);

    expect(unsubscribeUseCase.execute).not.toHaveBeenCalled();
  });

  it('conserve le desabonnement par lien en GET', async () => {
    await request(getHttpServer())
      .get(`/${API_PREFIX}/newsletter/unsubscribe`)
      .query({ token: VALID_TOKEN })
      .expect(200);

    expect(unsubscribeUseCase.execute).toHaveBeenCalledWith(VALID_TOKEN, {
      sendAck: true,
    });
  });

  it('reste idempotent sur un rejeu du POST', async () => {
    await request(getHttpServer())
      .post(`/${API_PREFIX}/newsletter/unsubscribe`)
      .query({ token: VALID_TOKEN })
      .expect(200);

    unsubscribeUseCase.execute.mockResolvedValue({
      status: 'unsubscribed',
      alreadyUnsubscribed: true,
    });

    const replay = await request(getHttpServer())
      .post(`/${API_PREFIX}/newsletter/unsubscribe`)
      .query({ token: VALID_TOKEN })
      .expect(200);

    expect(replay.body).toEqual({ status: 'unsubscribed' });
    expect(unsubscribeUseCase.execute).toHaveBeenCalledTimes(2);
  });

  describe('contrat entre l’en-tete List-Unsubscribe et la route servie', () => {
    it('l’URL annoncee dans l’en-tete resout vers une route reellement montee', async () => {
      const configService = {
        get: jest.fn((key: string) =>
          key === 'API_PREFIX' ? API_PREFIX : undefined,
        ),
      } as unknown as ConfigService;
      const mailer = new NewsletterMailerService(configService);

      mockSendMail.mockClear();
      await mailer.sendWelcome(buildNewsletterSubscriber());

      const [[message]] = mockSendMail.mock.calls as [
        [{ headers: Record<string, string> }],
      ];
      const httpUri = /<(https?:\/\/[^>]+)>/.exec(
        message.headers['List-Unsubscribe'],
      );
      expect(httpUri).not.toBeNull();

      const { pathname, search } = new URL(httpUri![1]);
      await request(getHttpServer()).post(`${pathname}${search}`).expect(200);
    });
  });
});
