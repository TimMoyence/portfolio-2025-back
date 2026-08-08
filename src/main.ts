import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/interfaces/filters/all-exceptions.filter';
import { DomainExceptionFilter } from './common/interfaces/filters/DomainExceptionFilter';

function logBootstrapStep(message: string): void {
  if (process.env.BOOTSTRAP_DEBUG === 'true') {
    console.log(`[bootstrap] ${message}`);
  }
}

async function bootstrap() {
  logBootstrapStep('starting bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  logBootstrapStep('nest application created');
  app.useLogger(app.get(Logger));

  const isProd = process.env.NODE_ENV === 'production';

  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : [];

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

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Limite globale du body parser : 600 KB couvre les imports CSV
  // (max 500 KB cote DTO @MaxLength) avec une marge pour l'overhead
  // JSON. Au-dela, body-parser repond 413 avant que le DTO ne soit
  // construit, evitant un DoS event-loop (HIGH-2 audit 2026-05-09).
  // API native NestExpressApplication : pas besoin d'importer express
  // directement (NestExpressBodyParserOptions.limit, pnpm 9 isolated).
  app.useBodyParser('json', { limit: '600kb' });
  app.useBodyParser('urlencoded', { limit: '600kb', extended: true });

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

  app.useGlobalFilters(new AllExceptionsFilter(), new DomainExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api');

  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Portfolio 2025 API')
      .setDescription('HTTP API documentation for the portfolio backend')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const swaggerPath = process.env.SWAGGER_PATH ?? 'docs';
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  app.enableShutdownHooks();

  logBootstrapStep('starting listen');
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
  logBootstrapStep('listen complete');
}
void bootstrap();
