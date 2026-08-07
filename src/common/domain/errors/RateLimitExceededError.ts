import { DomainError } from './DomainError';

export class RateLimitExceededError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
