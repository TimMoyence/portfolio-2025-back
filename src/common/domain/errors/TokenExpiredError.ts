import { DomainError } from './DomainError';

export class TokenExpiredError extends DomainError {
  constructor(message = 'Token expire') {
    super(message);
  }
}
