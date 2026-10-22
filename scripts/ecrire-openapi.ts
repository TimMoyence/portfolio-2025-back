import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { documentOpenApi } from '../src/common/interfaces/http/document-openapi';
import { prefixerLesRoutes } from '../src/common/interfaces/http/prefixer-les-routes';
import { RACINE } from '../test/helpers/racine';

async function ecrireOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  });
  prefixerLesRoutes(app);
  writeFileSync(
    join(RACINE, 'openapi.json'),
    `${JSON.stringify(documentOpenApi(app), null, 2)}\n`,
  );
  await app.close();
}

void ecrireOpenApi();
