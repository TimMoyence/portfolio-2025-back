import { Injectable, Logger } from '@nestjs/common';

type AuthEvent =
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

@Injectable()
export class AuthAuditLogger {
  private readonly logger = new Logger('AuthAudit');

  log(entry: AuthAuditEntry): void {
    this.logger.log(JSON.stringify(entry));
  }
}
