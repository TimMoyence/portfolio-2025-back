import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './common/interfaces/health/health.module';
import { MetricsModule } from './common/interfaces/metrics/metrics.module';
import { SecurityModule } from './common/interfaces/security/security.module';
import { CorrelationIdMiddleware } from './common/interfaces/middleware/correlation-id.middleware';
import { validateEnv } from './config/env.validation';
import { optionsJournalHttp } from './config/journal-http';

import { ensureDatabaseExists } from './database/ensure-database';
import { resolveRuntimeContexts } from './runtime/runtime-contexts';

const runtimeContexts = resolveRuntimeContexts();

function logBootstrapStep(message: string): void {
  if (process.env.BOOTSTRAP_DEBUG === 'true') {
    console.log(`[bootstrap] ${message}`);
  }
}

function firstEnv(...names: string[]): string | undefined {
  return names
    .map((name) => process.env[name])
    .find((value) => value !== undefined);
}

function isEnvTrue(...names: string[]): boolean {
  return names.some((name) => process.env[name] === 'true');
}

function envNumber(name: string, fallback: number): number {
  return Number(process.env[name] ?? fallback);
}

interface SslOption {
  rejectUnauthorized: boolean;
}

interface DbCredentials {
  host?: string;
  port?: string;
  username?: string;
  password?: string;
}

function resolveSslOption(): SslOption | undefined {
  if (!isEnvTrue('DB_SSL', 'DATABASE_SSL')) return undefined;
  return { rejectUnauthorized: process.env.NODE_ENV === 'production' };
}

function resolveDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim() || undefined;
}

function resolveDatabaseName(
  databaseUrl: string | undefined,
): string | undefined {
  const declared = firstEnv('DB_NAME', 'DATABASE_NAME', 'POSTGRES_DB');
  if (declared !== undefined) return declared;
  if (databaseUrl === undefined) return undefined;
  return new URL(databaseUrl).pathname.replace(/^\//, '');
}

function resolveSynchronize(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    isEnvTrue('TYPEORM_SYNCHRONIZE', 'DB_SYNCHRONIZE')
  );
}

function resolvePoolExtra(): Record<string, number> {
  // Pool PG dimensionne pour l'usage concurrent API + BullMQ workers
  // (audit worker hammer la DB pendant pipeline 180s). Defaut node-postgres
  // 10 saturait facilement. Configurable via DB_POOL_MAX.
  return {
    max: envNumber('DB_POOL_MAX', 30),
    idleTimeoutMillis: envNumber('DB_POOL_IDLE_TIMEOUT_MS', 30_000),
    connectionTimeoutMillis: envNumber('DB_POOL_CONNECT_TIMEOUT_MS', 5_000),
  };
}

function resolveCredentials(): DbCredentials {
  return {
    host: firstEnv('DB_HOST', 'DATABASE_HOST', 'PGHOST'),
    port: firstEnv('DB_PORT', 'DATABASE_PORT', 'PGPORT'),
    username: firstEnv(
      'DB_USERNAME',
      'DB_USER',
      'DATABASE_USER',
      'POSTGRES_USER',
    ),
    password: firstEnv(
      'DB_PASSWORD',
      'DB_PASS',
      'DATABASE_PASSWORD',
      'POSTGRES_PASSWORD',
    ),
  };
}

interface DbLocation {
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}

interface PostgresBaseOptions {
  type: 'postgres';
  entities: string[];
  synchronize: boolean;
  extra: Record<string, number>;
  ssl?: SslOption;
}

function credentialOptions({
  host,
  port,
  username,
  password,
}: DbCredentials): DbLocation {
  return {
    ...(host ? { host } : {}),
    ...(port ? { port: Number(port) } : {}),
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
  };
}

interface ConnectionInput {
  base: PostgresBaseOptions;
  databaseUrl: string | undefined;
  database: string | undefined;
  credentials: DbCredentials;
}

function buildConnectionOptions({
  base,
  databaseUrl,
  database,
  credentials,
}: ConnectionInput): TypeOrmModuleOptions {
  const location: DbLocation = databaseUrl
    ? { url: databaseUrl }
    : credentialOptions(credentials);

  return { ...base, ...location, ...(database ? { database } : {}) };
}

async function ensureTargetDatabase({
  databaseUrl,
  database,
  credentials,
  ssl,
}: Omit<ConnectionInput, 'base'> & {
  ssl: SslOption | undefined;
}): Promise<void> {
  if (!database) return;

  if (databaseUrl) {
    const adminUrl = new URL(databaseUrl);
    adminUrl.pathname = `/${firstEnv('DB_ADMIN_DATABASE', 'DATABASE_ADMIN_NAME') ?? 'postgres'}`;
    await ensureDatabaseExists({
      connectionString: adminUrl.toString(),
      database,
      ssl,
    });
    return;
  }

  const { host, port, username, password } = credentials;
  if (!host || !username) return;

  logBootstrapStep(`ensuring database ${database}`);
  await ensureDatabaseExists({
    host,
    port: port ? Number(port) : undefined,
    username,
    password,
    database,
    ssl,
  });
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot({
      pinoHttp: optionsJournalHttp(process.env.NODE_ENV),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 30,
      },
    ]),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: async (): Promise<TypeOrmModuleOptions> => {
        logBootstrapStep('typeorm factory start');

        const ssl = resolveSslOption();
        const databaseUrl = resolveDatabaseUrl();
        const database = resolveDatabaseName(databaseUrl);
        const credentials = resolveCredentials();

        const base: PostgresBaseOptions = {
          type: 'postgres',
          entities: [join(__dirname, '**/*.entity.{js,ts}')],
          synchronize: resolveSynchronize(),
          extra: resolvePoolExtra(),
          ...(ssl ? { ssl } : {}),
        };

        await ensureTargetDatabase({ databaseUrl, database, credentials, ssl });

        logBootstrapStep('typeorm factory done');
        return buildConnectionOptions({
          base,
          databaseUrl,
          database,
          credentials,
        });
      },
    }),
    ...runtimeContexts.runtimeModules,
    HealthModule,
    SecurityModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
