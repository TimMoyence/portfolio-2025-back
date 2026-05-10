import { DomainError } from '../../../../common/domain/errors/DomainError';

/** Token d'invitation inconnu (hash absent en base). */
export class InvalidInvitationTokenError extends DomainError {
  readonly code = 'INVITATION_NOT_FOUND';
  constructor(message = 'Cette invitation est introuvable.') {
    super(message);
  }
}

/** Invitation deja acceptee par un autre user (ou le meme). */
export class InvitationAlreadyConsumedError extends DomainError {
  readonly code = 'INVITATION_ALREADY_CONSUMED';
  constructor(message = 'Cette invitation a deja ete utilisee.') {
    super(message);
  }
}

/** Invitation revoquee par l'inviter (re-share, expiration auto, ou annulation). */
export class InvitationRevokedError extends DomainError {
  readonly code = 'INVITATION_REVOKED';
  constructor(message = 'Cette invitation a ete revoquee.') {
    super(message);
  }
}

/** Invitation expiree (expires_at < now). */
export class InvitationExpiredError extends DomainError {
  readonly code = 'INVITATION_EXPIRED';
  constructor(message = 'Cette invitation a expire.') {
    super(message);
  }
}

/** L'email du compte qui accepte ne correspond pas a l'email cible. */
export class InvitationEmailMismatchError extends DomainError {
  readonly code = 'INVITATION_EMAIL_MISMATCH';
  constructor(targetEmail: string, actualEmail: string) {
    super(
      `Cette invitation est destinee a ${targetEmail}, mais ton compte utilise ${actualEmail}. Demande a l'inviter de re-partager avec la bonne adresse.`,
    );
  }
}
