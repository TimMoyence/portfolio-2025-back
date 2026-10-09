import type { INestApplication } from '@nestjs/common';

export function ouvrirAuxOrigines(
  app: INestApplication,
  origines: readonly string[],
): void {
  app.enableCors({
    origin: [...origines],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
  });
}
