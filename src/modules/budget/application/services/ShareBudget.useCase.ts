import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { RateLimitExceededError } from '../../../../common/domain/errors/RateLimitExceededError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { IBudgetInvitationRepository } from '../../domain/IBudgetInvitation.repository';
import type { IBudgetShareAttemptRepository } from '../../domain/IBudgetShareAttempt.repository';
import type { IBudgetShareNotifier } from '../../domain/IBudgetShareNotifier';
import {
  BUDGET_GROUP_REPOSITORY,
  BUDGET_INVITATION_REPOSITORY,
  BUDGET_SHARE_ATTEMPT_REPOSITORY,
  BUDGET_SHARE_NOTIFIER,
} from '../../domain/token';
import type { IUsersRepository } from '../../../users/domain/IUsers.repository';
import { USERS_REPOSITORY } from '../../../users/domain/token';
import type {
  ShareBudgetCommand,
  ShareBudgetResult,
} from '../dto/ShareBudget.command';

/**
 * Partage un groupe de budget avec un utilisateur identifie par email.
 *
 * Branches :
 *  - A) email a un compte → auto-join + mail "tu as ete ajoute" (sauf
 *    si deja membre → idempotent silencieux).
 *  - B) email n'a pas de compte → cree une BudgetInvitation (token
 *    SHA-256 stocke, clair envoye dans l'email) + mail magic-link.
 *
 * Defenses anti mail-bombing :
 *  - quota applicatif 5/24h par inviter (RateLimitExceededError → 429),
 *  - cooldown 5 min sur (groupId, targetEmail) — skip silencieux,
 *  - throttler HTTP defense-in-depth sur le controller.
 */
@Injectable()
export class ShareBudgetUseCase {
  /** Fenetre de cooldown anti mail-bombing : 5 minutes. */
  private static readonly COOLDOWN_MS = 5 * 60 * 1000;

  /** Quota maximum d'invitations par inviter sur une fenetre glissante. */
  private static readonly DAILY_LIMIT = 5;

  /** Fenetre du quota inviter (24h). */
  private static readonly DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

  /** TTL d'une BudgetInvitation magic-link (7 jours). */
  private static readonly INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
    @Inject(BUDGET_INVITATION_REPOSITORY)
    private readonly invitationRepo: IBudgetInvitationRepository,
  ) {}

  async execute(command: ShareBudgetCommand): Promise<ShareBudgetResult> {
    const group = await this.groupRepo.findById(command.groupId);
    if (!group) {
      throw new ResourceNotFoundError('Budget group not found');
    }
    if (group.ownerId !== command.userId) {
      throw new InsufficientPermissionsError(
        'Only the group owner can share the budget',
      );
    }

    const now = new Date();
    const since = new Date(now.getTime() - ShareBudgetUseCase.DAILY_WINDOW_MS);
    const recentCount = await this.shareAttemptRepo.countByInviterSince(
      command.userId,
      since,
    );
    if (recentCount >= ShareBudgetUseCase.DAILY_LIMIT) {
      throw new RateLimitExceededError(
        `Quota d'invitations atteint (${ShareBudgetUseCase.DAILY_LIMIT} par 24h). Reessaie demain.`,
      );
    }

    const targetUser = await this.usersRepo.findByEmail(command.targetEmail);
    const cooldownStart = new Date(
      now.getTime() - ShareBudgetUseCase.COOLDOWN_MS,
    );
    const recent = await this.shareAttemptRepo.findRecent(
      command.groupId,
      command.targetEmail,
      cooldownStart,
    );

    if (targetUser && targetUser.id) {
      // Branche A — compte existe
      const alreadyMember = await this.groupRepo.isMember(
        command.groupId,
        targetUser.id,
      );
      if (alreadyMember) {
        return { status: 'already-member' };
      }
      try {
        await this.groupRepo.addMember(command.groupId, targetUser.id);
      } catch (error) {
        if (ShareBudgetUseCase.isUniqueViolation(error)) {
          this.logger.warn(
            `Race detectee sur addMember (${command.groupId}, ${command.targetEmail})`,
          );
          return { status: 'shared' };
        }
        throw error;
      }

      if (recent) {
        this.logger.warn(
          `Cooldown actif sur ${command.targetEmail}, mail skip (branche A)`,
        );
        return { status: 'shared' };
      }

      await this.shareAttemptRepo.record(
        command.groupId,
        command.targetEmail,
        now,
        command.userId,
      );

      const owner = await this.usersRepo.findById(command.userId);
      const corsOrigin = this.configService.get<string>(
        'CORS_ORIGIN',
        'http://localhost:4200',
      );
      const budgetUrl = `${corsOrigin.split(',')[0]}/atelier/budget`;

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

      return { status: 'shared' };
    }

    // Branche B — pas de compte → invitation magic-link
    const existing = await this.invitationRepo.findActiveByGroupAndEmail(
      command.groupId,
      command.targetEmail,
    );
    if (existing) {
      await this.invitationRepo.markRevoked(existing.id, now);
    }

    const tokenClear = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(tokenClear).digest('hex');
    const expiresAt = new Date(
      now.getTime() + ShareBudgetUseCase.INVITATION_TTL_MS,
    );

    let invitation;
    try {
      invitation = await this.invitationRepo.create({
        groupId: command.groupId,
        inviterUserId: command.userId,
        targetEmail: command.targetEmail,
        tokenHash,
        expiresAt,
      });
    } catch (error) {
      if (ShareBudgetUseCase.isUniqueViolation(error)) {
        this.logger.warn(
          `Race UNIQUE branche B (${command.groupId}, ${command.targetEmail}), retry`,
        );
        const fresh = await this.invitationRepo.findActiveByGroupAndEmail(
          command.groupId,
          command.targetEmail,
        );
        if (!fresh) throw error;
        invitation = fresh;
      } else {
        throw error;
      }
    }

    if (recent) {
      this.logger.warn(
        `Cooldown actif sur ${command.targetEmail}, mail skip (branche B)`,
      );
      return { status: 'invited' };
    }

    await this.shareAttemptRepo.record(
      command.groupId,
      command.targetEmail,
      now,
      command.userId,
    );

    const owner = await this.usersRepo.findById(command.userId);
    const corsOrigin = this.configService.get<string>(
      'CORS_ORIGIN',
      'http://localhost:4200',
    );
    const inviteUrl = `${corsOrigin.split(',')[0]}/fr/register?invite=${tokenClear}`;

    try {
      await this.notifier.sendBudgetInvitation({
        targetEmail: command.targetEmail,
        ownerFirstName: owner?.firstName ?? 'Un utilisateur',
        ownerLastName: owner?.lastName ?? '',
        groupName: group.name,
        inviteUrl,
        expiresAt: invitation.expiresAt,
      });
    } catch (error) {
      this.logger.error(
        `Budget invitation email failed for ${command.targetEmail}: ${String(error)}`,
      );
    }

    return { status: 'invited' };
  }

  /**
   * Detecte une violation de contrainte UNIQUE remontee par TypeORM/pg.
   * Utilise pour rendre `addMember` et `invitationRepo.create` idempotents
   * en cas de race condition sans dependre du driver Postgres a runtime.
   */
  private static isUniqueViolation(error: unknown): boolean {
    if (error === null || typeof error !== 'object') return false;
    const code = (error as { code?: string }).code;
    if (code === '23505') return true;
    const message = (error as { message?: string }).message;
    return typeof message === 'string' && message.includes('unique constraint');
  }
}
