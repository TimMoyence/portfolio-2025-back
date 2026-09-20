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

export class BlankFieldError extends DomainValidationError {
  constructor(champ: string) {
    super(`${champ} ne peut pas être vide.`);
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

export class ActiviteInconnueError extends DomainValidationError {
  readonly code = 'ACTIVITE_INCONNUE';

  constructor(screenId: string, activityId: string) {
    super(
      `L’activité ${activityId} n’existe pas sur l’écran ${screenId} de ce cours.`,
    );
  }
}

export class PilotageIncompatibleError extends DomainValidationError {
  constructor(screenId: string, raison: string) {
    super(`Pilotage impossible sur l’écran ${screenId} : ${raison}.`);
  }
}

export class PhaseNonMonotoneError extends ResourceConflictError {
  readonly code = 'PHASE_NON_MONOTONE';

  constructor(screenId: string) {
    super(
      `Le pilotage de l’écran ${screenId} ne revient pas en arrière : la classe a déjà vu l’étape suivante.`,
    );
  }
}

export class PhaseFermeeError extends ResourceConflictError {
  readonly code = 'PHASE_FERMEE';

  constructor(screenId: string) {
    super(
      `Cette question de l’écran ${screenId} n’est pas ouverte dans la phase en cours.`,
    );
  }
}

export class EcranNonServiError extends ResourceConflictError {
  readonly code = 'ECRAN_NON_SERVI';

  constructor(screenId: string) {
    super(
      `L’écran ${screenId} n’a pas encore été projeté : attendez que le formateur y arrive.`,
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
