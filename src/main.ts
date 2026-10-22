import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { bornerLesCorpsDeRequete } from './common/interfaces/http/corps-de-requete';
import { ouvrirAuxOrigines } from './common/interfaces/http/cors';
import { documentOpenApi } from './common/interfaces/http/document-openapi';
import { prefixerLesRoutes } from './common/interfaces/http/prefixer-les-routes';
import { appliquerLesTraitementsGlobaux } from './common/interfaces/http/traitements-globaux';
import {
  envListe,
  envPort,
  envString,
  estEnProduction,
} from './config/env-readers.util';
import { logBootstrapStep } from './runtime/log-bootstrap-step';

async function bootstrap() {
  logBootstrapStep('starting bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  logBootstrapStep('nest application created');
  app.useLogger(app.get(Logger));

  const isProd = estEnProduction();

  const corsOrigins = envListe('CORS_ORIGIN');

  // L'API n'est jamais exposee directement : elle est servie derriere un
  // reverse-proxy (deploy/compose.yaml, reseau `web` externe, aucun
  // `ports:` publie). Sans cette ligne, `req.ip` vaut l'adresse du proxy
  // pour tout le monde et les compteurs du ThrottlerGuard degenerent en
  // un bucket unique partage par l'ensemble des clients.
  //
  // La valeur est numerique et volontairement pas `true` : elle ne fait
  // confiance qu'au dernier bond, celui du proxy. Avec `true`, un client
  // pourrait forger un `X-Forwarded-For` et se choisir une IP arbitraire
  // pour echapper au rate-limiting.
  app.set('trust proxy', 1);

  ouvrirAuxOrigines(app, corsOrigins);

  // Limite globale du body parser : 600 KB. Au-dela, body-parser repond
  // 413 avant que le DTO ne soit construit, evitant un DoS event-loop
  // (HIGH-2 audit 2026-05-09).
  // API native NestExpressApplication : pas besoin d'importer express
  // directement (NestExpressBodyParserOptions.limit, pnpm 9 isolated).
  bornerLesCorpsDeRequete(app);

  app.use(cookieParser());

  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
      strictTransportSecurity: {
        maxAge: 63072000,
        includeSubDomains: true,
      },
    }),
  );

  appliquerLesTraitementsGlobaux(app);

  prefixerLesRoutes(app);

  if (!isProd) {
    const swaggerPath = envString('SWAGGER_PATH') ?? 'docs';
    SwaggerModule.setup(swaggerPath, app, documentOpenApi(app), {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  app.enableShutdownHooks();

  logBootstrapStep('starting listen');
  await app.listen(envPort(['PORT'], 'HTTP') ?? 3000);
  logBootstrapStep('listen complete');
}
void bootstrap();
