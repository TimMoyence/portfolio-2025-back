import { Type } from '@nestjs/common';
import { AuditRequestsModule } from '../modules/audit-requests/AuditRequests.module';
import { ContactsModule } from '../modules/contacts/Contacts.module';
import { CookieConsentsModule } from '../modules/cookie-consents/CookieConsents.module';
import { CoursesModule } from '../modules/courses/Courses.module';
import { ProjectsModule } from '../modules/projects/Projects.module';
import { RedirectsModule } from '../modules/redirects/Redirects.module';
import { ServicesModule } from '../modules/services/Services.module';
import { UsersModule } from '../modules/users/Users.module';

export interface RuntimeContextsSelection {
  readonly coreModules: Array<Type<unknown>>;
  readonly legacyModules: Array<Type<unknown>>;
  readonly runtimeModules: Array<Type<unknown>>;
  readonly legacyEnabled: boolean;
}

function parseBooleanFlag(raw: string | undefined): boolean {
  return raw?.trim().toLowerCase() === 'true';
}

export function resolveRuntimeContexts(
  env: NodeJS.ProcessEnv = process.env,
): RuntimeContextsSelection {
  const coreModules: Array<Type<unknown>> = [
    UsersModule,
    ContactsModule,
    CookieConsentsModule,
    AuditRequestsModule,
  ];

  const legacyModules: Array<Type<unknown>> = [
    ServicesModule,
    ProjectsModule,
    CoursesModule,
    RedirectsModule,
  ];

  const legacyEnabled = parseBooleanFlag(env.ENABLE_LEGACY_CMS_CONTEXTS);

  return {
    coreModules,
    legacyModules,
    runtimeModules: legacyEnabled
      ? [...coreModules, ...legacyModules]
      : coreModules,
    legacyEnabled,
  };
}
