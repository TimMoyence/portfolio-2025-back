import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { ResourceConflictError } from '../../../../common/domain/errors/ResourceConflictError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';

export class InvalidSessionCodeError extends DomainValidationError {
  constructor(value: string) {
    super(`Code de session invalide: ${value}`);
  }
}

export class SessionNotFoundError extends ResourceNotFoundError {
  constructor(code: string) {
    super(`Aucune session ouverte pour le code ${code}`);
  }
}

export class SessionClosedError extends ResourceConflictError {
  constructor() {
    super('La session est terminee');
  }
}

export class InvalidStateTransitionError extends ResourceConflictError {
  constructor(from: string, to: string) {
    super(`Transition interdite de ${from} vers ${to}`);
  }
}

export class SeedPoolExhaustedError extends ResourceConflictError {
  constructor() {
    super('Plus aucun tirage disponible pour cette session');
  }
}

export class AnswerAlreadySubmittedError extends ResourceConflictError {
  constructor(questionId: string) {
    super(`Reponse deja soumise pour la question ${questionId}`);
  }
}

export class SeedAlreadyAssignedError extends ResourceConflictError {
  constructor(seed: number) {
    super(`Le tirage ${seed} est deja attribue dans cette session`);
  }
}
