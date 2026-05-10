import { DomainError } from './DomainError';

/**
 * L'utilisateur a depasse un quota applicatif (distinct du throttler
 * Nest qui agit au niveau HTTP). Mappe vers HTTP 429.
 */
export class RateLimitExceededError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
