import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { InvalidInputError } from '../../../../common/domain/errors/InvalidInputError';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import { BUDGET_GROUP_REPOSITORY } from '../../domain/token';

export interface RemoveBudgetGroupMemberCommand {
  groupId: string;
  /** UserId du demandeur (doit etre owner). */
  actorUserId: string;
  /** UserId du membre a retirer (jamais l'owner). */
  targetUserId: string;
}

/**
 * Retire un membre d'un groupe budget. Verifie successivement :
 *  1. l'actor est owner du groupe ;
 *  2. l'actor n'essaie pas de se retirer lui-meme (=owner) ;
 *  3. la cible n'est pas owner (defense en profondeur, cas pratiquement
 *     impossible vu qu'il n'y a qu'un owner par groupe).
 *
 * Les contributions du membre retire sont supprimees en cascade par la
 * FK ON DELETE CASCADE de budget_member_contributions.
 */
@Injectable()
export class RemoveBudgetGroupMemberUseCase {
  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(command: RemoveBudgetGroupMemberCommand): Promise<void> {
    const actorIsOwner = await this.groupRepo.isOwner(
      command.groupId,
      command.actorUserId,
    );
    if (!actorIsOwner) {
      throw new InsufficientPermissionsError(
        'Only the group owner can remove members',
      );
    }
    if (command.targetUserId === command.actorUserId) {
      throw new InvalidInputError('Cannot remove the owner of the group');
    }
    const targetIsOwner = await this.groupRepo.isOwner(
      command.groupId,
      command.targetUserId,
    );
    if (targetIsOwner) {
      throw new InvalidInputError('Cannot remove the owner of the group');
    }
    await this.groupRepo.removeMember(command.groupId, command.targetUserId);
  }
}
