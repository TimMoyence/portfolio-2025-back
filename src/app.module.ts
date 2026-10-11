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

import { optionsTypeOrmDeLApi } from './database/options-typeorm';
import { logBootstrapStep } from './runtime/log-bootstrap-step';
import { resolveRuntimeContexts } from './runtime/runtime-contexts';

const runtimeContexts = resolveRuntimeContexts();

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
        const options = await optionsTypeOrmDeLApi(
          join(__dirname, '**/*.entity.{js,ts}'),
        );
        logBootstrapStep('typeorm factory done');
        return options;
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
