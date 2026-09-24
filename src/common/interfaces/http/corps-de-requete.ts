import type { NestExpressApplication } from '@nestjs/platform-express';

const LIMITE_CORPS_DE_REQUETE = '600kb';

export function bornerLesCorpsDeRequete(app: NestExpressApplication): void {
  app.useBodyParser('json', { limit: LIMITE_CORPS_DE_REQUETE });
  app.useBodyParser('urlencoded', {
    limit: LIMITE_CORPS_DE_REQUETE,
    extended: true,
  });
}
