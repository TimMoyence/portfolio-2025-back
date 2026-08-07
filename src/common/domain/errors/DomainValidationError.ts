import { DomainError } from './DomainError';

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
