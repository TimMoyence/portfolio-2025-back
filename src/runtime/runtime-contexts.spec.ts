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
import { resolveRuntimeContexts } from './runtime-contexts';

describe('resolveRuntimeContexts', () => {
  it('keeps only core modules by default', () => {
    const selection = resolveRuntimeContexts({});

    expect(selection.legacyEnabled).toBe(false);
    expect(selection.coreModules).toEqual([
      UsersModule,
      ContactsModule,
      CookieConsentsModule,
      AuditRequestsModule,
      LeadMagnetsModule,
      NewsletterModule,
      PresentationsModule,
      ArticlesModule,
      FormationsModule,
    ]);
    expect(selection.runtimeModules).toEqual(selection.coreModules);
  });

  it('enables legacy modules when feature flag is true', () => {
    const selection = resolveRuntimeContexts({
      ENABLE_LEGACY_CMS_CONTEXTS: 'true',
    });

    expect(selection.legacyEnabled).toBe(true);
    expect(selection.legacyModules).toEqual([
      ServicesModule,
      ProjectsModule,
      CoursesModule,
      RedirectsModule,
    ]);
    expect(selection.runtimeModules).toEqual([
      UsersModule,
      ContactsModule,
      CookieConsentsModule,
      AuditRequestsModule,
      LeadMagnetsModule,
      NewsletterModule,
      PresentationsModule,
      ArticlesModule,
      FormationsModule,
      ServicesModule,
      ProjectsModule,
      CoursesModule,
      RedirectsModule,
    ]);
  });
});
