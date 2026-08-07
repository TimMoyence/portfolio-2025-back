import { DomainError } from './DomainError';

export class TokenReuseDetectedError extends DomainError {
  constructor(message = 'Reutilisation de token detectee') {
    super(message);
  }
}
