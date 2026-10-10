import { Type } from '@nestjs/common';
import { envBool } from '../config/env-readers.util';
import { AuditRequestsModule } from '../modules/audit-requests/AuditRequests.module';
import { ContactsModule } from '../modules/contacts/Contacts.module';
import { CookieConsentsModule } from '../modules/cookie-consents/CookieConsents.module';
import { CoursesModule } from '../modules/courses/Courses.module';
import { ProjectsModule } from '../modules/projects/Projects.module';
import { RedirectsModule } from '../modules/redirects/Redirects.module';
import { ServicesModule } from '../modules/services/Services.module';
import { UsersModule } from '../modules/users/Users.module';
import { LeadMagnetsModule } from '../modules/lead-magnets/LeadMagnets.module';
import { NewsletterModule } from '../modules/newsletter/Newsletter.module';
import { PresentationsModule } from '../modules/presentations/Presentations.module';
import { ArticlesModule } from '../modules/articles/Articles.module';
import { FormationsModule } from '../modules/formations/Formations.module';

export interface RuntimeContextsSelection {
  readonly coreModules: Array<Type<unknown>>;
  readonly legacyModules: Array<Type<unknown>>;
  readonly runtimeModules: Array<Type<unknown>>;
  readonly legacyEnabled: boolean;
}

export function resolveRuntimeContexts(
  env: NodeJS.ProcessEnv = process.env,
): RuntimeContextsSelection {
  const coreModules: Array<Type<unknown>> = [
    UsersModule,
    ContactsModule,
    CookieConsentsModule,
    AuditRequestsModule,
    LeadMagnetsModule,
    NewsletterModule,
    PresentationsModule,
    ArticlesModule,
    FormationsModule,
  ];

  const legacyModules: Array<Type<unknown>> = [
    ServicesModule,
    ProjectsModule,
    CoursesModule,
    RedirectsModule,
  ];

  const legacyEnabled = envBool('ENABLE_LEGACY_CMS_CONTEXTS', false, env);

  return {
    coreModules,
    legacyModules,
    runtimeModules: legacyEnabled
      ? [...coreModules, ...legacyModules]
      : coreModules,
    legacyEnabled,
  };
}
