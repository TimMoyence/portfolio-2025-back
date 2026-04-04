import { DomainError } from './DomainError';

/** Erreur levee quand un token (refresh, reset, etc.) a expire. */
export class TokenExpiredError extends DomainError {
  constructor(message = 'Token expire') {
    super(message);
  }
}
