import { DomainError } from './DomainError';

export class ResourceConflictError extends DomainError {
  constructor(message = 'Conflit avec la ressource existante') {
    super(message);
  }
}
