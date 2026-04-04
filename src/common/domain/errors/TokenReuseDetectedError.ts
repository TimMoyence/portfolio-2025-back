import { DomainError } from './DomainError';

/** Erreur levee quand une reutilisation de token est detectee (rotation compromise). */
export class TokenReuseDetectedError extends DomainError {
  constructor(message = 'Reutilisation de token detectee') {
    super(message);
  }
}
