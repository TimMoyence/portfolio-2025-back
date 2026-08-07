import { DomainError } from './DomainError';

export class UserNotFoundError extends DomainError {
  constructor(message = 'Utilisateur introuvable') {
    super(message);
  }
}
