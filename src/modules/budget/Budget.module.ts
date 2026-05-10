import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/Users.module';
import {
  BUDGET_CATEGORY_REPOSITORY,
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GOAL_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
  BUDGET_INVITATION_REPOSITORY,
  BUDGET_MEMBER_CONTRIBUTION_REPOSITORY,
  BUDGET_PDF_RENDERER,
  BUDGET_SHARE_ATTEMPT_REPOSITORY,
  BUDGET_SHARE_NOTIFIER,
  CATEGORY_INFERENCE_STRATEGY,
  RECURRING_ENTRY_REPOSITORY,
} from './domain/token';
import { BudgetPdfRenderer } from './infrastructure/pdf/BudgetPdfRenderer';
import { RevolutCategoryInferenceStrategy } from './infrastructure/inference/RevolutCategoryInferenceStrategy';
import {
  defaultCategoryRulesConfig,
  type CategoryRulesConfig,
} from './infrastructure/inference/category-rules.config';
import { BudgetCategoryEntity } from './infrastructure/entities/BudgetCategory.entity';
import { BudgetEntryEntity } from './infrastructure/entities/BudgetEntry.entity';
import { RecurringEntryEntity } from './infrastructure/entities/RecurringEntry.entity';
import { BudgetGroupEntity } from './infrastructure/entities/BudgetGroup.entity';
import { BudgetGroupMemberEntity } from './infrastructure/entities/BudgetGroupMember.entity';
import { BudgetShareAttemptEntity } from './infrastructure/entities/BudgetShareAttempt.entity';
import { BudgetMemberContributionEntity } from './infrastructure/entities/BudgetMemberContribution.entity';
import { BudgetGoalEntity } from './infrastructure/entities/BudgetGoal.entity';
import { BudgetInvitationEntity } from './infrastructure/entities/BudgetInvitation.entity';
import { BudgetCategoryRepositoryTypeORM } from './infrastructure/BudgetCategory.repository.typeORM';
import { BudgetEntryRepositoryTypeORM } from './infrastructure/BudgetEntry.repository.typeORM';
import { BudgetGroupRepositoryTypeORM } from './infrastructure/BudgetGroup.repository.typeORM';
import { BudgetShareAttemptRepositoryTypeORM } from './infrastructure/BudgetShareAttempt.repository.typeORM';
import { RecurringEntryRepositoryTypeORM } from './infrastructure/RecurringEntry.repository.typeORM';
import { BudgetMemberContributionRepositoryTypeORM } from './infrastructure/BudgetMemberContribution.repository.typeORM';
import { BudgetGoalRepositoryTypeORM } from './infrastructure/BudgetGoal.repository.typeORM';
import { BudgetInvitationTypeOrmRepository } from './infrastructure/BudgetInvitation.repository.typeORM';
import { BudgetShareMailerService } from './infrastructure/BudgetShareMailer.service';
import { BudgetController } from './interfaces/Budget.controller';
import { BudgetRecurringController } from './interfaces/BudgetRecurring.controller';
import { BudgetExportController } from './interfaces/BudgetExport.controller';
import { BudgetContributionsController } from './interfaces/BudgetContributions.controller';
import { BudgetGoalsController } from './interfaces/BudgetGoals.controller';
import { CreateBudgetCategoryUseCase } from './application/services/CreateBudgetCategory.useCase';
import { CreateBudgetEntryUseCase } from './application/services/CreateBudgetEntry.useCase';
import { CreateBudgetGroupUseCase } from './application/services/CreateBudgetGroup.useCase';
import { GetBudgetCategoriesUseCase } from './application/services/GetBudgetCategories.useCase';
import { GetBudgetEntriesUseCase } from './application/services/GetBudgetEntries.useCase';
import { GetBudgetGroupsUseCase } from './application/services/GetBudgetGroups.useCase';
import { GetBudgetSummaryUseCase } from './application/services/GetBudgetSummary.useCase';
import { ImportBudgetEntriesUseCase } from './application/services/ImportBudgetEntries.useCase';
import { UpdateBudgetEntryUseCase } from './application/services/UpdateBudgetEntry.useCase';
import { DeleteBudgetEntryUseCase } from './application/services/DeleteBudgetEntry.useCase';
import { UpdateBudgetCategoryUseCase } from './application/services/UpdateBudgetCategory.useCase';
import { ExportBudgetPdfUseCase } from './application/services/ExportBudgetPdf.useCase';
import { ShareBudgetUseCase } from './application/services/ShareBudget.useCase';
import { CreateRecurringEntryUseCase } from './application/services/CreateRecurringEntry.useCase';
import { GetRecurringEntriesUseCase } from './application/services/GetRecurringEntries.useCase';
import { UpdateRecurringEntryUseCase } from './application/services/UpdateRecurringEntry.useCase';
import { DeleteRecurringEntryUseCase } from './application/services/DeleteRecurringEntry.useCase';
import { ApplyRecurringEntriesUseCase } from './application/services/ApplyRecurringEntries.useCase';
import { GetBudgetContributionsUseCase } from './application/services/GetBudgetContributions.useCase';
import { UpsertMyBudgetContributionUseCase } from './application/services/UpsertMyBudgetContribution.useCase';
import { CreateBudgetGoalUseCase } from './application/services/CreateBudgetGoal.useCase';
import { GetBudgetGoalsWithProgressUseCase } from './application/services/GetBudgetGoalsWithProgress.useCase';
import { UpdateBudgetGoalUseCase } from './application/services/UpdateBudgetGoal.useCase';
import { DeleteBudgetGoalUseCase } from './application/services/DeleteBudgetGoal.useCase';
import { GetBudgetGroupMembersUseCase } from './application/services/GetBudgetGroupMembers.useCase';
import { RemoveBudgetGroupMemberUseCase } from './application/services/RemoveBudgetGroupMember.useCase';
import { GetBudgetEntriesMonthsUseCase } from './application/services/GetBudgetEntriesMonths.useCase';
import { AcceptBudgetInvitationUseCase } from './application/services/AcceptBudgetInvitation.useCase';
import { ListPendingInvitationsUseCase } from './application/services/ListPendingInvitations.useCase';

const BUDGET_USE_CASES = [
  CreateBudgetGroupUseCase,
  CreateBudgetEntryUseCase,
  GetBudgetEntriesUseCase,
  GetBudgetGroupsUseCase,
  GetBudgetSummaryUseCase,
  ImportBudgetEntriesUseCase,
  UpdateBudgetEntryUseCase,
  CreateBudgetCategoryUseCase,
  GetBudgetCategoriesUseCase,
  DeleteBudgetEntryUseCase,
  UpdateBudgetCategoryUseCase,
  ExportBudgetPdfUseCase,
  ShareBudgetUseCase,
  CreateRecurringEntryUseCase,
  GetRecurringEntriesUseCase,
  UpdateRecurringEntryUseCase,
  DeleteRecurringEntryUseCase,
  ApplyRecurringEntriesUseCase,
  GetBudgetContributionsUseCase,
  UpsertMyBudgetContributionUseCase,
  CreateBudgetGoalUseCase,
  GetBudgetGoalsWithProgressUseCase,
  UpdateBudgetGoalUseCase,
  DeleteBudgetGoalUseCase,
  GetBudgetGroupMembersUseCase,
  RemoveBudgetGroupMemberUseCase,
  GetBudgetEntriesMonthsUseCase,
  AcceptBudgetInvitationUseCase,
  ListPendingInvitationsUseCase,
];

/**
 * Module NestJS du domaine Budget.
 *
 * Enregistre les entites TypeORM, les repositories,
 * les use cases et le controleur REST.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BudgetGroupEntity,
      BudgetGroupMemberEntity,
      BudgetCategoryEntity,
      BudgetEntryEntity,
      RecurringEntryEntity,
      BudgetShareAttemptEntity,
      BudgetMemberContributionEntity,
      BudgetGoalEntity,
      BudgetInvitationEntity,
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [
    BudgetController,
    BudgetRecurringController,
    BudgetExportController,
    BudgetContributionsController,
    BudgetGoalsController,
  ],
  providers: [
    ...BUDGET_USE_CASES,
    {
      provide: BUDGET_GROUP_REPOSITORY,
      useClass: BudgetGroupRepositoryTypeORM,
    },
    {
      provide: BUDGET_CATEGORY_REPOSITORY,
      useClass: BudgetCategoryRepositoryTypeORM,
    },
    {
      provide: BUDGET_ENTRY_REPOSITORY,
      useClass: BudgetEntryRepositoryTypeORM,
    },
    {
      provide: BUDGET_SHARE_NOTIFIER,
      useClass: BudgetShareMailerService,
    },
    {
      provide: BUDGET_SHARE_ATTEMPT_REPOSITORY,
      useClass: BudgetShareAttemptRepositoryTypeORM,
    },
    {
      provide: RECURRING_ENTRY_REPOSITORY,
      useClass: RecurringEntryRepositoryTypeORM,
    },
    {
      provide: BUDGET_PDF_RENDERER,
      useClass: BudgetPdfRenderer,
    },
    {
      provide: CATEGORY_INFERENCE_STRATEGY,
      useFactory: (): RevolutCategoryInferenceStrategy => {
        const config = loadCategoryRulesConfig();
        return new RevolutCategoryInferenceStrategy(config);
      },
    },
    {
      provide: BUDGET_MEMBER_CONTRIBUTION_REPOSITORY,
      useClass: BudgetMemberContributionRepositoryTypeORM,
    },
    {
      provide: BUDGET_GOAL_REPOSITORY,
      useClass: BudgetGoalRepositoryTypeORM,
    },
    {
      provide: BUDGET_INVITATION_REPOSITORY,
      useClass: BudgetInvitationTypeOrmRepository,
    },
  ],
  exports: [
    AcceptBudgetInvitationUseCase,
    BUDGET_INVITATION_REPOSITORY,
    BUDGET_GROUP_REPOSITORY,
  ],
})
export class BudgetModule {}

/**
 * Charge la configuration des regles d'inference de categorie.
 *
 * Si `BUDGET_CATEGORY_RULES_PATH` est defini et pointe vers un fichier JSON
 * lisible, ce fichier prevaut sur la config par defaut anonymisee. Permet aux
 * utilisateurs finaux de fournir leurs propres regles personnelles (RGPD :
 * keywords contenant des donnees nominatives) sans les commiter dans le repo.
 *
 * En cas d'erreur de parse ou d'IO, on fallback sur la config par defaut et on
 * log un warning : ne jamais bloquer l'app au boot pour une config optionnelle.
 */
function loadCategoryRulesConfig(): CategoryRulesConfig {
  const externalPath = process.env.BUDGET_CATEGORY_RULES_PATH;
  if (!externalPath) {
    return defaultCategoryRulesConfig;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs');
    const raw = fs.readFileSync(externalPath, 'utf-8');
    return JSON.parse(raw) as CategoryRulesConfig;
  } catch (error) {
    console.warn(
      `[BudgetModule] Failed to load BUDGET_CATEGORY_RULES_PATH=${externalPath}, falling back to default rules:`,
      error,
    );
    return defaultCategoryRulesConfig;
  }
}
