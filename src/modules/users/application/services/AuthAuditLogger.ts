import { Injectable, Logger } from '@nestjs/common';

/** Types d'événements d'authentification traçables. */
export type AuthEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'GOOGLE_AUTH_SUCCESS'
  | 'GOOGLE_AUTH_FAILURE'
  | 'TOKEN_REFRESH'
  | 'TOKEN_REFRESH_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE';

export interface AuthAuditEntry {
  event: AuthEvent;
  email?: string;
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  details?: string;
}

/**
 * Logger structuré des événements d'authentification.
 * Produit des logs JSON pour faciliter la détection d'intrusion et le suivi des accès.
 */
@Injectable()
export class AuthAuditLogger {
  private readonly logger = new Logger('AuthAudit');

  /** Enregistre un événement d'authentification sous forme JSON structuré. */
  log(entry: AuthAuditEntry): void {
    this.logger.log(JSON.stringify(entry));
  }
}
