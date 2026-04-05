import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SEBASTIAN_ENTRY_REPOSITORY,
  SEBASTIAN_GOAL_REPOSITORY,
  SEBASTIAN_BADGE_REPOSITORY,
  TELEGRAM_LINK_REPOSITORY,
} from './domain/token';
import { SebastianEntryEntity } from './infrastructure/entities/SebastianEntry.entity';
import { SebastianGoalEntity } from './infrastructure/entities/SebastianGoal.entity';
import { SebastianBadgeEntity } from './infrastructure/entities/SebastianBadge.entity';
import { TelegramLinkEntity } from './infrastructure/entities/TelegramLink.entity';
import { SebastianEntryRepositoryTypeORM } from './infrastructure/SebastianEntry.repository.typeORM';
import { SebastianGoalRepositoryTypeORM } from './infrastructure/SebastianGoal.repository.typeORM';
import { SebastianBadgeRepositoryTypeORM } from './infrastructure/SebastianBadge.repository.typeORM';
import { TelegramLinkRepositoryTypeORM } from './infrastructure/TelegramLink.repository.typeORM';
import { TelegramBotService } from './infrastructure/TelegramBotService';
import { SebastianController } from './interfaces/Sebastian.controller';
import { SebastianBotHandler } from './interfaces/telegram/SebastianBot.handler';
import { AddEntryUseCase } from './application/services/AddEntry.useCase';
import { ListEntriesUseCase } from './application/services/ListEntries.useCase';
import { DeleteEntryUseCase } from './application/services/DeleteEntry.useCase';
import { GetStatsUseCase } from './application/services/GetStats.useCase';
import { SetGoalUseCase } from './application/services/SetGoal.useCase';
import { ListGoalsUseCase } from './application/services/ListGoals.useCase';
import { DeleteGoalUseCase } from './application/services/DeleteGoal.useCase';
import { GetTrendDataUseCase } from './application/services/GetTrendData.useCase';
import { CalculateHealthScoreUseCase } from './application/services/CalculateHealthScore.useCase';
import { EvaluateBadgesUseCase } from './application/services/EvaluateBadges.useCase';
import { ListBadgesUseCase } from './application/services/ListBadges.useCase';
import { GetPeriodReportUseCase } from './application/services/GetPeriodReport.useCase';
import { LinkTelegramUserUseCase } from './application/services/LinkTelegramUser.useCase';
import { ResolveTelegramUserUseCase } from './application/services/ResolveTelegramUser.useCase';
import { RegisterDrinksFromTelegramUseCase } from './application/services/RegisterDrinksFromTelegram.useCase';
import { UsersModule } from '../users/Users.module';

const SEBASTIAN_USE_CASES = [
  AddEntryUseCase,
  ListEntriesUseCase,
  DeleteEntryUseCase,
  GetStatsUseCase,
  SetGoalUseCase,
  ListGoalsUseCase,
  DeleteGoalUseCase,
  GetTrendDataUseCase,
  CalculateHealthScoreUseCase,
  EvaluateBadgesUseCase,
  ListBadgesUseCase,
  GetPeriodReportUseCase,
];

const SEBASTIAN_TELEGRAM_PROVIDERS = [
  LinkTelegramUserUseCase,
  ResolveTelegramUserUseCase,
  RegisterDrinksFromTelegramUseCase,
  SebastianBotHandler,
  TelegramBotService,
];

/**
 * Module NestJS du domaine Sebastian.
 *
 * Enregistre les entites TypeORM, les repositories,
 * les use cases, le controleur REST et le bot Telegram
 * pour le suivi de consommation.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SebastianEntryEntity,
      SebastianGoalEntity,
      SebastianBadgeEntity,
      TelegramLinkEntity,
    ]),
    UsersModule,
  ],
  controllers: [SebastianController],
  providers: [
    ...SEBASTIAN_USE_CASES,
    ...SEBASTIAN_TELEGRAM_PROVIDERS,
    {
      provide: SEBASTIAN_ENTRY_REPOSITORY,
      useClass: SebastianEntryRepositoryTypeORM,
    },
    {
      provide: SEBASTIAN_GOAL_REPOSITORY,
      useClass: SebastianGoalRepositoryTypeORM,
    },
    {
      provide: SEBASTIAN_BADGE_REPOSITORY,
      useClass: SebastianBadgeRepositoryTypeORM,
    },
    {
      provide: TELEGRAM_LINK_REPOSITORY,
      useClass: TelegramLinkRepositoryTypeORM,
    },
  ],
})
export class SebastianModule {}
