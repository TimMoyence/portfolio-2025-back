import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';
import { HealthModule } from './common/interfaces/health/health.module';
import { SecurityModule } from './common/interfaces/security/security.module';
import { validateEnv } from './config/env.validation';
import { optionsJournalHttp } from './config/journal-http';

import { optionsTypeOrmDeLApi } from './database/options-typeorm';
import { ArticlesModule } from './modules/articles/Articles.module';
import { AuditRequestsModule } from './modules/audit-requests/AuditRequests.module';
import { ContactsModule } from './modules/contacts/Contacts.module';
import { FormationsModule } from './modules/formations/Formations.module';
import { LeadMagnetsModule } from './modules/lead-magnets/LeadMagnets.module';
import { PresentationsModule } from './modules/presentations/Presentations.module';
import { UsersModule } from './modules/users/Users.module';
import { logBootstrapStep } from './runtime/log-bootstrap-step';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot({
      pinoHttp: optionsJournalHttp(),
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
    UsersModule,
    ContactsModule,
    AuditRequestsModule,
    LeadMagnetsModule,
    PresentationsModule,
    ArticlesModule,
    FormationsModule,
    HealthModule,
    SecurityModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
