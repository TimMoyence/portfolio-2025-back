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
  readonly code = 'SEANCE_INTROUVABLE';

  constructor(id: string) {
    super(`Session introuvable: ${id}`);
  }
}

export class CoursInconnuError extends ResourceNotFoundError {
  readonly code = 'COURS_INTROUVABLE';

  constructor(slug: string) {
    super(`Cours introuvable: ${slug}`);
  }
}

export class ParticipantNotFoundError extends ResourceNotFoundError {
  readonly code = 'PARTICIPANT_INTROUVABLE';

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

export class SeanceCompleteError extends ResourceConflictError {
  readonly code = 'SEANCE_COMPLETE';

  constructor(capacite: number) {
    super(
      `Cette séance a atteint sa capacité de ${capacite} participants : demandez au formateur de libérer une place.`,
    );
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

export class TypeDeQuestionError extends DomainValidationError {
  readonly code = 'TYPE_DE_QUESTION';

  constructor(questionId: string, raison: string) {
    super(`La question ${questionId} ${raison}.`);
  }
}

export class ProductionVideError extends DomainValidationError {
  readonly code = 'PRODUCTION_VIDE';

  constructor(questionId: string) {
    super(
      `Aucune saisie envoyée pour ${questionId} : répondez ou déclarez « je ne sais pas ».`,
    );
  }
}

export class ProductionInvalideError extends DomainValidationError {
  readonly code = 'PRODUCTION_INVALIDE';

  constructor(questionId: string, raison: string) {
    super(`Production refusée pour ${questionId} : ${raison}.`);
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

export class DefiInconnuError extends ResourceNotFoundError {
  readonly code = 'ACTIVITE_INCONNUE';

  constructor(defiId: string) {
    super(`Défi absent du cours de cette séance : ${defiId}`);
  }
}

export class DefiSansTentativeError extends ResourceNotFoundError {
  readonly code = 'DEFI_SANS_TENTATIVE';

  constructor(defiId: string) {
    super(
      `Les stratégies du défi ${defiId} ne sont servies qu’après votre propre tentative.`,
    );
  }
}

export class RappelsIndisponiblesError extends ResourceNotFoundError {
  constructor(slug: string) {
    super(`Aucun écran de rappel espacé dans le cours ${slug}`);
  }
}

export class EnigmeInconnueError extends ResourceNotFoundError {
  constructor(parcoursId: string, enigmeId: string) {
    super(`Énigme ${enigmeId} absente du parcours ${parcoursId}`);
  }
}

export class EnigmeVerrouilleeError extends ResourceConflictError {
  readonly code = 'ENIGME_VERROUILLEE';

  constructor(enigmeId: string) {
    super(
      `L’énigme ${enigmeId} n’est pas encore ouverte : résolvez la précédente ou épuisez ses tentatives.`,
    );
  }
}

export class EnigmeDejaResolueError extends ResourceConflictError {
  readonly code = 'ENIGME_DEJA_RESOLUE';

  constructor(enigmeId: string) {
    super(`Vous avez déjà trouvé le fragment de l’énigme ${enigmeId}.`);
  }
}

export class TentativesEpuiseesError extends ResourceConflictError {
  readonly code = 'TENTATIVES_EPUISEES';

  constructor(enigmeId: string) {
    super(
      `Les tentatives de l’énigme ${enigmeId} sont épuisées : passez à la suivante.`,
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

export class PlafondDeFluxAtteintError extends RateLimitExceededError {
  readonly code = 'PLAFOND_DE_FLUX_ATTEINT';

  constructor(cle: string) {
    super(`Plafond de flux atteint pour ${cle} sur une autre instance.`);
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

export class VersionNonPubliableError extends ResourceConflictError {
  readonly code = 'VERSION_NON_PUBLIABLE';

  constructor(slug: string, version: number, raison: string) {
    super(`La version ${version} de ${slug} n’est pas publiable : ${raison}.`);
  }
}

export class CoursModifieError extends ResourceConflictError {
  readonly code = 'COURS_MODIFIE';

  constructor() {
    super(
      'Le cours a changé depuis l’ouverture de la séance : le formateur doit ouvrir une nouvelle séance.',
    );
  }
}
