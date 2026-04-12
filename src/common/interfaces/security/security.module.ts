import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { InMemorySecurityEventsStore } from './in-memory-security-events-store';
import { SECURITY_EVENTS_STORE } from './ISecurityEventsStore';
import { loadSecurityConfig } from './security.config';
import { SECURITY_CONFIG } from './security.tokens';
import { SuspiciousRequestInterceptor } from './suspicious-request.interceptor';

/**
 * Module global de securite applicative.
 *
 * - Enregistre un intercepteur global qui score chaque requete HTTP
 *   completee (UA, path, response time, status) et trace les clients
 *   suspects dans un store en memoire dedouble.
 * - Expose `SECURITY_EVENTS_STORE` pour les consommateurs (ex: endpoint
 *   metrics/security admin qui retourne le top-N des IPs suspectes).
 *
 * Le module est @Global pour que n'importe quel autre module puisse
 * injecter le store sans ajout d'import explicite.
 */
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
  ],
  exports: [SECURITY_EVENTS_STORE, SECURITY_CONFIG],
})
export class SecurityModule {}
