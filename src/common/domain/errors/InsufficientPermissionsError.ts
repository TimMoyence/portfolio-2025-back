import { DomainError } from './DomainError';

export class InsufficientPermissionsError extends DomainError {
  constructor(message = 'Permissions insuffisantes') {
    super(message);
  }
}
