import { DomainError } from './DomainError';

/** Erreur levee lorsqu'un invariant du domaine est viole. */
export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
