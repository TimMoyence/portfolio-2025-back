import { DomainError } from './DomainError';

/** Erreur levee quand l'utilisateur n'a pas les permissions requises. */
export class InsufficientPermissionsError extends DomainError {
  constructor(message = 'Permissions insuffisantes') {
    super(message);
  }
}
