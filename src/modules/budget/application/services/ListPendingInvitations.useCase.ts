import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { IBudgetInvitationRepository } from '../../domain/IBudgetInvitation.repository';
import {
  BUDGET_GROUP_REPOSITORY,
  BUDGET_INVITATION_REPOSITORY,
} from '../../domain/token';
import type {
  ListPendingInvitationsQuery,
  PendingInvitationView,
} from '../dto/ListPendingInvitations.query';

/**
 * Use case de listing des invitations pending d'un groupe budget.
 *
 * Owner-only : seul le owner du groupe peut lister les invitations en
 * attente (relance, audit, revocation a venir). Les invitations
 * expirees, acceptees ou revoquees ne sont pas retournees — la borne
 * `now` est calculee a l'execution et propagee au repository pour que
 * le filtrage sur `expiresAt` se fasse au plus pres de la base.
 *
 * Le controle de permission est effectue avant le lookup des
 * invitations afin d'eviter toute fuite d'information sur la presence
 * ou l'absence d'invitations a un demandeur non legitime.
 */
@Injectable()
export class ListPendingInvitationsUseCase {
  constructor(
    @Inject(BUDGET_INVITATION_REPOSITORY)
    private readonly invitationRepo: IBudgetInvitationRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(
    query: ListPendingInvitationsQuery,
  ): Promise<PendingInvitationView[]> {
    const group = await this.groupRepo.findById(query.groupId);
    if (!group) {
      throw new ResourceNotFoundError(
        `Le groupe budget est introuvable (id=${query.groupId}).`,
      );
    }
    if (group.ownerId !== query.userId) {
      throw new InsufficientPermissionsError(
        'Seul le owner du groupe peut lister les invitations pending.',
      );
    }

    const now = new Date(Date.now());
    const invitations = await this.invitationRepo.findPendingByGroup(
      query.groupId,
      now,
    );

    return invitations.map((invitation) => ({
      id: invitation.id,
      targetEmail: invitation.targetEmail,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    }));
  }
}
