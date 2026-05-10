import { createHash } from 'crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import {
  InvalidInvitationTokenError,
  InvitationAlreadyConsumedError,
  InvitationEmailMismatchError,
  InvitationExpiredError,
  InvitationRevokedError,
} from '../../domain/errors/InvitationErrors';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { IBudgetInvitationRepository } from '../../domain/IBudgetInvitation.repository';
import {
  BUDGET_GROUP_REPOSITORY,
  BUDGET_INVITATION_REPOSITORY,
} from '../../domain/token';
import type {
  AcceptBudgetInvitationCommand,
  AcceptBudgetInvitationResult,
} from '../dto/AcceptBudgetInvitation.command';

/**
 * Use case d'acceptation d'une invitation magic-link de partage de budget.
 *
 * Etapes :
 * 1. Trim + re-hash du `tokenClear` recu du mail en SHA-256 (le clair n'est
 *    jamais persiste cote serveur). Token vide apres trim =>
 *    `InvalidInvitationTokenError`.
 * 2. Lookup de l'invitation par hash. Token inconnu => `InvalidInvitationTokenError`.
 * 3. Verifications d'etat de l'invitation dans l'ordre :
 *    - revoquee => `InvitationRevokedError`
 *    - deja acceptee => `InvitationAlreadyConsumedError`
 *    - expiree => `InvitationExpiredError`
 *    - email different (case-insensitive) => `InvitationEmailMismatchError`
 * 4. Lookup du groupe cible. Supprime entre temps => `ResourceNotFoundError`.
 * 5. Ajout du membre (idempotent : skip si deja membre, swallow PG23505 sur
 *    race) puis marquage de l'invitation comme acceptee.
 *
 * Atomicite : addMember et markAccepted ne sont pas wrappes dans une
 * transaction (use case orchestre 2 ports differents). Si markAccepted
 * echoue apres un addMember reussi, l'utilisateur est membre mais
 * l'invitation reste pending — le retry du token est idempotent
 * (isMember=true => skip addMember + markAccepted re-tente).
 */
@Injectable()
export class AcceptBudgetInvitationUseCase {
  private readonly logger = new Logger(AcceptBudgetInvitationUseCase.name);

  constructor(
    @Inject(BUDGET_INVITATION_REPOSITORY)
    private readonly invitationRepo: IBudgetInvitationRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(
    command: AcceptBudgetInvitationCommand,
  ): Promise<AcceptBudgetInvitationResult> {
    const normalizedToken = command.tokenClear.trim();
    if (normalizedToken.length === 0) {
      throw new InvalidInvitationTokenError();
    }
    const tokenHash = createHash('sha256')
      .update(normalizedToken)
      .digest('hex');

    const invitation = await this.invitationRepo.findByTokenHash(tokenHash);
    if (!invitation) {
      throw new InvalidInvitationTokenError();
    }

    if (invitation.revokedAt !== null) {
      throw new InvitationRevokedError();
    }
    if (invitation.acceptedAt !== null) {
      throw new InvitationAlreadyConsumedError();
    }

    const now = new Date();
    if (invitation.isExpired(now)) {
      throw new InvitationExpiredError();
    }

    if (
      invitation.targetEmail.toLowerCase() !==
      command.acceptedByEmail.toLowerCase()
    ) {
      throw new InvitationEmailMismatchError(
        invitation.targetEmail,
        command.acceptedByEmail,
      );
    }

    const group = await this.groupRepo.findById(invitation.groupId);
    if (!group) {
      throw new ResourceNotFoundError(
        `Le groupe associe a cette invitation est introuvable (id=${invitation.groupId}).`,
      );
    }

    const alreadyMember = await this.groupRepo.isMember(
      invitation.groupId,
      command.acceptedByUserId,
    );
    if (!alreadyMember) {
      try {
        await this.groupRepo.addMember(
          invitation.groupId,
          command.acceptedByUserId,
        );
      } catch (error) {
        if (AcceptBudgetInvitationUseCase.isUniqueViolation(error)) {
          this.logger.warn(
            `Race detectee sur addMember (${invitation.groupId}, ${command.acceptedByUserId})`,
          );
        } else {
          throw error;
        }
      }
    }

    await this.invitationRepo.markAccepted(
      invitation.id,
      command.acceptedByUserId,
      now,
    );

    return { groupId: invitation.groupId, groupName: group.name };
  }

  /**
   * Detecte une violation de contrainte UNIQUE remontee par TypeORM/pg.
   * Utilise pour rendre `addMember` idempotent en cas de race condition
   * sans dependre du driver Postgres a runtime.
   */
  private static isUniqueViolation(error: unknown): boolean {
    if (error === null || typeof error !== 'object') return false;
    const code = (error as { code?: string }).code;
    if (code === '23505') return true;
    const message = (error as { message?: string }).message;
    return typeof message === 'string' && message.includes('unique constraint');
  }
}
