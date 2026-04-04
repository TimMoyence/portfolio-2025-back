import { DomainError } from './DomainError';

/** Erreur levee quand les identifiants fournis sont invalides. */
export class InvalidCredentialsError extends DomainError {
  constructor(message = 'Identifiants invalides') {
    super(message);
  }
}
