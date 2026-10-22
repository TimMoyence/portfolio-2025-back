import { type INestApplication, RequestMethod } from '@nestjs/common';
import { prefixeApi } from '../../../config/prefixe-api';

export function prefixerLesRoutes(app: INestApplication): void {
  app.setGlobalPrefix(prefixeApi(), {
    exclude: [
      { path: 'api/articles', method: RequestMethod.ALL },
      { path: 'api/articles/(.*)', method: RequestMethod.ALL },
    ],
  });
}
