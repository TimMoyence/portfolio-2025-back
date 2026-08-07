import { DomainError } from './DomainError';

export class InvalidCredentialsError extends DomainError {
  constructor(message = 'Identifiants invalides') {
    super(message);
  }
}
