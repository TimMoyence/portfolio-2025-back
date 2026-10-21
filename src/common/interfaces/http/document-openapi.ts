import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';

export function documentOpenApi(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Portfolio 2025 API')
      .setDescription('HTTP API documentation for the portfolio backend')
      .setVersion('1.0')
      .build(),
  );
}
