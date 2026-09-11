import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { InMemorySecurityEventsStore } from './in-memory-security-events-store';
import { SECURITY_EVENTS_STORE } from './ISecurityEventsStore';
import { loadSecurityConfig } from './security.config';
import { SECURITY_CONFIG } from './security.tokens';
import { SuspiciousRequestInterceptor } from './suspicious-request.interceptor';
import { PublicFormProtectionService } from './public-form-protection.service';

@Global()
@Module({
  providers: [
    InMemorySecurityEventsStore,
    {
      provide: SECURITY_CONFIG,
      useFactory: loadSecurityConfig,
    },
    {
      provide: SECURITY_EVENTS_STORE,
      useExisting: InMemorySecurityEventsStore,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SuspiciousRequestInterceptor,
    },
    PublicFormProtectionService,
  ],
  exports: [
    SECURITY_EVENTS_STORE,
    SECURITY_CONFIG,
    PublicFormProtectionService,
  ],
})
export class SecurityModule {}
