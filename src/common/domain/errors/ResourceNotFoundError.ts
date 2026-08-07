import { DomainError } from './DomainError';

export class ResourceNotFoundError extends DomainError {
  constructor(message = 'Ressource introuvable') {
    super(message);
  }
}
