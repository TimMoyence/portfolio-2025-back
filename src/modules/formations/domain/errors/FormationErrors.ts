import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceConflictError } from '../../../../common/domain/errors/ResourceConflictError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';

export class InvalidSessionCodeError extends DomainValidationError {
  constructor(value: string) {
    super(`Code de session invalide: ${value}`);
  }
}

export class SessionNotFoundError extends ResourceNotFoundError {
  constructor(id: string) {
    super(`Session introuvable: ${id}`);
  }
}

export class ParticipantNotFoundError extends ResourceNotFoundError {
  constructor(id: string) {
    super(`Participant introuvable: ${id}`);
  }
}

export class SessionNotOwnedError extends InsufficientPermissionsError {
  constructor(sessionId: string) {
    super(`La session ${sessionId} appartient a un autre formateur`);
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
