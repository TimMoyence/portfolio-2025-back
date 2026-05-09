import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { IBudgetShareNotifier } from '../../domain/IBudgetShareNotifier';
import type { IBudgetShareAttemptRepository } from '../../domain/IBudgetShareAttempt.repository';
import type { IUsersRepository } from '../../../users/domain/IUsers.repository';
import {
  BUDGET_GROUP_REPOSITORY,
  BUDGET_SHARE_ATTEMPT_REPOSITORY,
  BUDGET_SHARE_NOTIFIER,
} from '../../domain/token';
import { USERS_REPOSITORY } from '../../../users/domain/token';
import type { ShareBudgetCommand } from '../dto/ShareBudget.command';

/**
 * Partage un groupe de budget avec un utilisateur identifie par email.
 *
 * Defenses anti mail-bombing (CRIT-2 audit 2026-05-09) :
 *  - skip silencieux si la cible est deja membre (idempotence + pas de
 *    spam pour un partage deja effectif),
 *  - cooldown applicatif {@link COOLDOWN_MS} sur la paire
 *    (groupId, targetEmail) en complement du `@Throttle` HTTP du
 *    controleur (utile cross-instance et pour les tentatives espacees
 *    au-dela du TTL throttler mais toujours indesirables).
 */
@Injectable()
export class ShareBudgetUseCase {
  /** Fenetre de cooldown anti mail-bombing : 5 minutes. */
  private static readonly COOLDOWN_MS = 5 * 60 * 1000;

  private readonly logger = new Logger(ShareBudgetUseCase.name);

  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
    @Inject(USERS_REPOSITORY) private readonly usersRepo: IUsersRepository,
    @Inject(BUDGET_SHARE_NOTIFIER)
    private readonly notifier: IBudgetShareNotifier,
    @Inject(BUDGET_SHARE_ATTEMPT_REPOSITORY)
    private readonly shareAttemptRepo: IBudgetShareAttemptRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: ShareBudgetCommand,
  ): Promise<{ shared: true; userId: string }> {
    const group = await this.groupRepo.findById(command.groupId);
    if (!group) {
      throw new ResourceNotFoundError('Budget group not found');
    }
    if (group.ownerId !== command.userId) {
      throw new InsufficientPermissionsError(
        'Only the group owner can share the budget',
      );
    }
    const targetUser = await this.usersRepo.findByEmail(command.targetEmail);
    if (!targetUser || !targetUser.id) {
      throw new ResourceNotFoundError(
        `Aucun compte trouve pour ${command.targetEmail}. L'utilisateur doit d'abord creer un compte avec cette adresse email.`,
      );
    }
    const alreadyMember = await this.groupRepo.isMember(
      command.groupId,
      targetUser.id,
    );

    if (alreadyMember) {
      // Idempotent : pas de mutation, pas de mail (CRIT-2 anti-spam).
      return { shared: true, userId: targetUser.id };
    }

    await this.groupRepo.addMember(command.groupId, targetUser.id);

    const cooldownStart = new Date(Date.now() - ShareBudgetUseCase.COOLDOWN_MS);
    const recent = await this.shareAttemptRepo.findRecent(
      command.groupId,
      command.targetEmail,
      cooldownStart,
    );
    if (recent) {
      // Cooldown actif : le membre vient d'etre ajoute (ligne addMember
      // ci-dessus) mais on saute l'email pour eviter le mail-bombing
      // (CRIT-2). Le retour reste `{ shared: true }` puisque le partage
      // est effectif.
      this.logger.warn(
        `Cooldown actif sur ${command.targetEmail} pour groupe ${command.groupId}, mail skip`,
      );
      return { shared: true, userId: targetUser.id };
    }

    const owner = await this.usersRepo.findById(command.userId);
    const corsOrigin = this.configService.get<string>(
      'CORS_ORIGIN',
      'http://localhost:4200',
    );
    const budgetUrl = `${corsOrigin.split(',')[0]}/atelier/budget`;

    // Persister la tentative AVANT l'envoi : meme si SMTP echoue, le
    // cooldown s'applique pour eviter le hammering en cas de panne mail.
    await this.shareAttemptRepo.record(
      command.groupId,
      command.targetEmail,
      new Date(),
    );

    try {
      await this.notifier.sendBudgetShareNotification({
        targetEmail: command.targetEmail,
        targetFirstName: targetUser.firstName,
        ownerFirstName: owner?.firstName ?? 'Un utilisateur',
        ownerLastName: owner?.lastName ?? '',
        groupName: group.name,
        budgetUrl,
      });
    } catch (error) {
      this.logger.error(
        `Budget share email failed for ${command.targetEmail}: ${String(error)}`,
      );
    }

    return { shared: true, userId: targetUser.id };
  }
}
