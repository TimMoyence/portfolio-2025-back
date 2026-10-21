import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { schemasDuContrat } from './schemas-du-contrat';

export function avecLesSchemasDuContrat(
  document: OpenAPIObject,
): OpenAPIObject {
  const existants = document.components?.schemas ?? {};
  const ajoutes = schemasDuContrat();
  const doublons = Object.keys(ajoutes).filter((nom) =>
    Object.hasOwn(existants, nom),
  );
  if (doublons.length > 0) {
    throw new Error(
      `Composants OpenAPI nommes deux fois : ${doublons.join(', ')}`,
    );
  }
  return {
    ...document,
    components: {
      ...document.components,
      schemas: { ...existants, ...ajoutes },
    },
  };
}

export function documentOpenApi(app: INestApplication): OpenAPIObject {
  return avecLesSchemasDuContrat(
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Portfolio 2025 API')
        .setDescription('HTTP API documentation for the portfolio backend')
        .setVersion('1.0')
        .build(),
    ),
  );
}
