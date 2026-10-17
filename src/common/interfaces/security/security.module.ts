import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { loadSecurityConfig } from './security.config';
import { SECURITY_CONFIG } from './security.tokens';
import { SuspiciousRequestInterceptor } from './suspicious-request.interceptor';

@Module({
  providers: [
    {
      provide: SECURITY_CONFIG,
      useFactory: loadSecurityConfig,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SuspiciousRequestInterceptor,
    },
  ],
})
export class SecurityModule {}
