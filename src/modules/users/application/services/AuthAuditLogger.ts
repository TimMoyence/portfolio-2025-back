import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pseudonymeDAdresse } from '../../../../common/domain/crypto/pseudonyme-d-adresse';
import type { ValeursDeLEnv } from '../../../../config/env.validation';

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

  constructor(private readonly config: ConfigService<ValeursDeLEnv>) {}

  log({ email, ...entry }: AuthAuditEntry): void {
    const secret = this.config.getOrThrow<string>(
      'SECURE_KEY_FOR_PASSWORD_HASHING',
    );
    this.logger.log(
      JSON.stringify({
        ...entry,
        ...(email === undefined
          ? {}
          : { compte: pseudonymeDAdresse(secret, email) }),
      }),
    );
  }
}
