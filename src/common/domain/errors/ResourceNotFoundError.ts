import { DomainError } from './DomainError';

/** Erreur generique levee quand une ressource est introuvable. */
export class ResourceNotFoundError extends DomainError {
  constructor(message = 'Ressource introuvable') {
    super(message);
  }
}
