import type { INestApplication } from '@nestjs/common';
import type { Cours } from '../../../../src/modules/formations/domain/contrats/cours';
import { creerCatalogueDeTest } from '../../../factories/formations/cours/cours.factory';
import { createMockDepotsFormations } from '../../../factories/formations/formation.factory';
import { monterApplicationFormations } from '../seance/formations-harness';
import { fermerApplication } from '../../http/nest-test-app';
import {
  documentOpenApiFormations,
  ecartsAuSchemaDeReponse,
} from '../../http/schema-openapi';

export function installerApplicationSurCatalogue(
  cours: Cours,
): () => INestApplication {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await monterApplicationFormations(
      createMockDepotsFormations(),
      creerCatalogueDeTest(cours),
    );
  });

  afterAll(async () => {
    if (app !== undefined) {
      await fermerApplication(app);
    }
  });

  return () => {
    if (app === undefined) {
      throw new Error('Application lue avant son montage');
    }
    return app;
  };
}

export function ecartsAuSchemaDeLaRoute(
  app: INestApplication,
  suffixeDeChemin: string,
  corps: unknown,
): string[] {
  return ecartsAuSchemaDeReponse(
    documentOpenApiFormations(app),
    suffixeDeChemin,
    corps,
  );
}
