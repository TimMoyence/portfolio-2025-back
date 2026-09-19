import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { RateLimitExceededError } from '../../../../common/domain/errors/RateLimitExceededError';
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

export class CoursInconnuError extends ResourceNotFoundError {
  constructor(slug: string) {
    super(`Cours introuvable: ${slug}`);
  }
}

export class ParticipantNotFoundError extends ResourceNotFoundError {
  constructor(id: string) {
    super(`Participant introuvable: ${id}`);
  }
}

export class FormationGroupNotFoundError extends ResourceNotFoundError {
  constructor(groupId: string) {
    super(`Groupe introuvable dans cette séance : ${groupId}`);
  }
}

export class FormationGroupNameTakenError extends ResourceConflictError {
  readonly code = 'NOM_DE_GROUPE_DEJA_PRIS';

  constructor(name: string) {
    super(
      `Le groupe « ${name} » existe déjà dans cette séance : choisissez un autre nom.`,
    );
  }
}

export class SessionNotOwnedError extends InsufficientPermissionsError {
  constructor(sessionId: string) {
    super(`La session ${sessionId} appartient a un autre formateur`);
  }
}

export class SessionClosedError extends ResourceConflictError {
  readonly code = 'SEANCE_TERMINEE';

  constructor() {
    super(
      'La séance est terminée : les réponses ne sont plus acceptées, les résultats restent consultables.',
    );
  }
}

export class SessionNotStartedError extends ResourceConflictError {
  readonly code = 'SEANCE_NON_DEMARREE';

  constructor() {
    super(
      "La séance n'a pas encore commencé : attendez que le formateur la démarre pour envoyer vos réponses.",
    );
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
  readonly code = 'REPONSE_DEJA_ENREGISTREE';

  constructor(questionId: string) {
    super(
      `Votre réponse à la question ${questionId} est déjà enregistrée : passez à la suivante.`,
    );
  }
}

export class SessionStreamLimitError extends RateLimitExceededError {
  constructor() {
    super(
      'Trop de connexions simultanées au suivi de cette séance. Fermez un onglet et réessayez.',
    );
  }
}

export class SeedAlreadyAssignedError extends ResourceConflictError {
  constructor(seed: number) {
    super(`Le tirage ${seed} est deja attribue dans cette session`);
  }
}

export class SessionCodeAlreadyActiveError extends ResourceConflictError {
  constructor(code: string) {
    super(`Le code ${code} porte deja une seance active`);
  }
}

export class CoursModifieError extends ResourceConflictError {
  constructor() {
    super(
      'Le cours a changé depuis l’ouverture de la séance : le formateur doit ouvrir une nouvelle séance.',
    );
  }
}
