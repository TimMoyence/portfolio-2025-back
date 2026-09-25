import { Controller, Get, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  applicationDeLaSuite,
  httpServerOf,
  ouvrirApplication,
} from './helpers/nest-test-app';

@Controller('test-throttle')
class ThrottleTestController {
  @Get('default')
  defaultEndpoint(): { ok: boolean } {
    return { ok: true };
  }

  @Post('strict')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  strictEndpoint(): { ok: boolean } {
    return { ok: true };
  }
}

describe('Rate-limiting (ThrottlerGuard) — integration HTTP', () => {
  const app = applicationDeLaSuite(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 3 }])],
      controllers: [ThrottleTestController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    return ouvrirApplication(moduleRef);
  });

  const getHttpServer = () => httpServerOf(app());

  it('devrait accepter les requetes en dessous de la limite globale', async () => {
    for (let i = 0; i < 3; i++) {
      await request(getHttpServer()).get('/test-throttle/default').expect(200);
    }
  });

  it('devrait retourner 429 lorsque la limite globale est depassee', async () => {
    const response = await request(getHttpServer())
      .get('/test-throttle/default')
      .expect(429);

    expect(response.body.message).toContain('ThrottlerException');
  });

  it('devrait accepter les requetes en dessous de la limite specifique', async () => {
    for (let i = 0; i < 2; i++) {
      await request(getHttpServer()).post('/test-throttle/strict').expect(201);
    }
  });

  it('devrait retourner 429 lorsque la limite specifique est depassee', async () => {
    const response = await request(getHttpServer())
      .post('/test-throttle/strict')
      .expect(429);

    expect(response.body.message).toContain('ThrottlerException');
  });
});
