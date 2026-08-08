import { type INestApplication, ValidationPipe } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import type request from 'supertest';
import { GLOBAL_VALIDATION_PIPE_OPTIONS } from './validation-pipe';

export async function bootstrapTestApp(
  moduleRef: TestingModule,
  configure?: (app: INestApplication) => void,
): Promise<INestApplication> {
  const app = moduleRef.createNestApplication();
  configure?.(app);
  app.useGlobalPipes(new ValidationPipe(GLOBAL_VALIDATION_PIPE_OPTIONS));
  app.setGlobalPrefix('api');
  await app.init();
  return app;
}

export function httpServerOf(
  app: INestApplication,
): Parameters<typeof request>[0] {
  return app.getHttpServer() as Parameters<typeof request>[0];
}
