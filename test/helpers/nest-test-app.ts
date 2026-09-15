import { type INestApplication, ValidationPipe } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type request from 'supertest';
import { GLOBAL_VALIDATION_PIPE_OPTIONS } from './validation-pipe';

export const ADRESSE_BOUCLE_LOCALE = '127.0.0.1';

export async function ecouterEnBoucleLocale(
  app: INestApplication,
): Promise<number> {
  await app.listen(0, ADRESSE_BOUCLE_LOCALE);
  return (serveurHttpDe(app).address() as AddressInfo).port;
}

export async function fermerApplication(app: INestApplication): Promise<void> {
  serveurHttpDe(app).closeAllConnections();
  await app.close();
}

export async function bootstrapTestApp(
  moduleRef: TestingModule,
  configure?: (app: INestApplication) => void,
): Promise<INestApplication> {
  const app = moduleRef.createNestApplication();
  configure?.(app);
  app.useGlobalPipes(new ValidationPipe(GLOBAL_VALIDATION_PIPE_OPTIONS));
  app.setGlobalPrefix('api');
  await ecouterEnBoucleLocale(app);
  return app;
}

export function httpServerOf(
  app: INestApplication,
): Parameters<typeof request>[0] {
  return serveurHttpDe(app);
}

function serveurHttpDe(app: INestApplication): Server {
  return app.getHttpServer() as Server;
}
