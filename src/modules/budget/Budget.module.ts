import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/Users.module';
import {
  BUDGET_CATEGORY_REPOSITORY,
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from './domain/token';
import { BudgetCategoryEntity } from './infrastructure/entities/BudgetCategory.entity';
import { BudgetEntryEntity } from './infrastructure/entities/BudgetEntry.entity';
import { BudgetGroupEntity } from './infrastructure/entities/BudgetGroup.entity';
import { BudgetGroupMemberEntity } from './infrastructure/entities/BudgetGroupMember.entity';
import { BudgetCategoryRepositoryTypeORM } from './infrastructure/BudgetCategory.repository.typeORM';
import { BudgetEntryRepositoryTypeORM } from './infrastructure/BudgetEntry.repository.typeORM';
import { BudgetGroupRepositoryTypeORM } from './infrastructure/BudgetGroup.repository.typeORM';
import { BudgetController } from './interfaces/Budget.controller';
import { CreateBudgetCategoryUseCase } from './application/services/CreateBudgetCategory.useCase';
import { CreateBudgetEntryUseCase } from './application/services/CreateBudgetEntry.useCase';
import { CreateBudgetGroupUseCase } from './application/services/CreateBudgetGroup.useCase';
import { GetBudgetCategoriesUseCase } from './application/services/GetBudgetCategories.useCase';
import { GetBudgetEntriesUseCase } from './application/services/GetBudgetEntries.useCase';
import { GetBudgetGroupsUseCase } from './application/services/GetBudgetGroups.useCase';
import { GetBudgetSummaryUseCase } from './application/services/GetBudgetSummary.useCase';
import { ImportBudgetEntriesUseCase } from './application/services/ImportBudgetEntries.useCase';
import { ShareBudgetUseCase } from './application/services/ShareBudget.useCase';

const BUDGET_USE_CASES = [
  CreateBudgetGroupUseCase,
  CreateBudgetEntryUseCase,
  GetBudgetEntriesUseCase,
  GetBudgetGroupsUseCase,
  GetBudgetSummaryUseCase,
  ImportBudgetEntriesUseCase,
  CreateBudgetCategoryUseCase,
  GetBudgetCategoriesUseCase,
  ShareBudgetUseCase,
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
    ]),
    UsersModule,
  ],
  controllers: [BudgetController],
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
  ],
})
export class BudgetModule {}
