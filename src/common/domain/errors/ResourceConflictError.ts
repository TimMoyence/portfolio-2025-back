import { DomainError } from './DomainError';

/** Erreur levee quand une operation entre en conflit avec l'etat actuel de la ressource. */
export class ResourceConflictError extends DomainError {
  constructor(message = 'Conflit avec la ressource existante') {
    super(message);
  }
}
