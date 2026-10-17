import { DomainError } from './DomainError';

export class RateLimitExceededError extends DomainError {
  constructor(
    message: string,
    readonly secondesAvantDeReessayer?: number,
  ) {
    super(message);
  }
}
