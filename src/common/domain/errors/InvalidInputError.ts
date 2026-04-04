import { DomainError } from './DomainError';

/** Erreur generique levee quand une donnee d'entree est invalide. */
export class InvalidInputError extends DomainError {
  constructor(message = 'Donnee invalide') {
    super(message);
  }
}
