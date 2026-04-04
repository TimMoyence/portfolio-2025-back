import { DomainError } from './DomainError';

/** Erreur levee quand l'utilisateur est introuvable. */
export class UserNotFoundError extends DomainError {
  constructor(message = 'Utilisateur introuvable') {
    super(message);
  }
}
