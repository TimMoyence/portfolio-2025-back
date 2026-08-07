import { DomainError } from './DomainError';

export class InvalidInputError extends DomainError {
  constructor(message = 'Donnee invalide') {
    super(message);
  }
}
