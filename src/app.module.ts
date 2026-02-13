import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/Users.module';

import { ensureDatabaseExists } from './database/ensure-database';
import { ContactsModule } from './modules/contacts/Contacts.module';
import { CookieConsentsModule } from './modules/cookie-consents/CookieConsents.module';
import { AuditRequestsModule } from './modules/audit-requests/AuditRequests.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: async (): Promise<TypeOrmModuleOptions> => {
        const sslEnabled =
          process.env.DB_SSL === 'true' || process.env.DATABASE_SSL === 'true';
        const sslOption = sslEnabled
          ? { rejectUnauthorized: false }
          : undefined;

        const databaseUrl =
          process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0
            ? process.env.DATABASE_URL.trim()
            : undefined;

        const databaseFromEnv =
          process.env.DB_NAME ??
          process.env.DATABASE_NAME ??
          process.env.POSTGRES_DB ??
          (databaseUrl
            ? new URL(databaseUrl).pathname.replace(/^\//, '')
            : undefined);

        const synchronize =
          process.env.TYPEORM_SYNCHRONIZE === 'true' ||
          process.env.DB_SYNCHRONIZE === 'true';

        const baseOptions: TypeOrmModuleOptions = {
          type: 'postgres',
          autoLoadEntities: true,
          synchronize,
          ...(sslOption ? { ssl: sslOption } : {}),
        };

        const host =
          process.env.DB_HOST ??
          process.env.DATABASE_HOST ??
          process.env.PGHOST ??
          undefined;
        const port =
          process.env.DB_PORT ??
          process.env.DATABASE_PORT ??
          process.env.PGPORT ??
          undefined;
        const username =
          process.env.DB_USERNAME ??
          process.env.DB_USER ??
          process.env.DATABASE_USER ??
          process.env.POSTGRES_USER ??
          undefined;
        const password =
          process.env.DB_PASSWORD ??
          process.env.DB_PASS ??
          process.env.DATABASE_PASSWORD ??
          process.env.POSTGRES_PASSWORD ??
          undefined;

        const connectionOptions: TypeOrmModuleOptions = databaseUrl
          ? {
              ...baseOptions,
              url: databaseUrl,
              ...(databaseFromEnv ? { database: databaseFromEnv } : {}),
            }
          : {
              ...baseOptions,
              ...(host ? { host } : {}),
              ...(port ? { port: Number(port) } : {}),
              ...(username ? { username } : {}),
              ...(password ? { password } : {}),
              ...(databaseFromEnv ? { database: databaseFromEnv } : {}),
            };

        if (databaseFromEnv) {
          if (databaseUrl) {
            const adminUrl = new URL(databaseUrl);
            const adminDatabase =
              process.env.DB_ADMIN_DATABASE ??
              process.env.DATABASE_ADMIN_NAME ??
              'postgres';
            adminUrl.pathname = `/${adminDatabase}`;

            await ensureDatabaseExists({
              connectionString: adminUrl.toString(),
              database: databaseFromEnv,
              ssl: sslOption,
            });
          } else if (host && username) {
            await ensureDatabaseExists({
              host,
              port: port ? Number(port) : undefined,
              username,
              password,
              database: databaseFromEnv,
              ssl: sslOption,
            });
          }
        }

        return connectionOptions;
      },
    }),
    UsersModule,
    ContactsModule,
    CookieConsentsModule,
    AuditRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
