/** Erreur levee lorsqu'un invariant du domaine est viole. */
export class DomainValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainValidationError';
  }
}
