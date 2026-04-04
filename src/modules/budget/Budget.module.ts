import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/Users.module';
import {
  BUDGET_CATEGORY_REPOSITORY,
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
  BUDGET_SHARE_NOTIFIER,
  RECURRING_ENTRY_REPOSITORY,
} from './domain/token';
import { BudgetCategoryEntity } from './infrastructure/entities/BudgetCategory.entity';
import { BudgetEntryEntity } from './infrastructure/entities/BudgetEntry.entity';
import { RecurringEntryEntity } from './infrastructure/entities/RecurringEntry.entity';
import { BudgetGroupEntity } from './infrastructure/entities/BudgetGroup.entity';
import { BudgetGroupMemberEntity } from './infrastructure/entities/BudgetGroupMember.entity';
import { BudgetCategoryRepositoryTypeORM } from './infrastructure/BudgetCategory.repository.typeORM';
import { BudgetEntryRepositoryTypeORM } from './infrastructure/BudgetEntry.repository.typeORM';
import { BudgetGroupRepositoryTypeORM } from './infrastructure/BudgetGroup.repository.typeORM';
import { RecurringEntryRepositoryTypeORM } from './infrastructure/RecurringEntry.repository.typeORM';
import { BudgetShareMailerService } from './infrastructure/BudgetShareMailer.service';
import { BudgetController } from './interfaces/Budget.controller';
import { BudgetRecurringController } from './interfaces/BudgetRecurring.controller';
import { BudgetExportController } from './interfaces/BudgetExport.controller';
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
    ]),
    UsersModule,
  ],
  controllers: [
    BudgetController,
    BudgetRecurringController,
    BudgetExportController,
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
      provide: RECURRING_ENTRY_REPOSITORY,
      useClass: RecurringEntryRepositoryTypeORM,
    },
  ],
})
export class BudgetModule {}
