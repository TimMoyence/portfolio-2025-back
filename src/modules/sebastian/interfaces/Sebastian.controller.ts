import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { AddEntryUseCase } from '../application/services/AddEntry.useCase';
import { ListEntriesUseCase } from '../application/services/ListEntries.useCase';
import { DeleteEntryUseCase } from '../application/services/DeleteEntry.useCase';
import { GetStatsUseCase } from '../application/services/GetStats.useCase';
import { SetGoalUseCase } from '../application/services/SetGoal.useCase';
import { ListGoalsUseCase } from '../application/services/ListGoals.useCase';
import { DeleteGoalUseCase } from '../application/services/DeleteGoal.useCase';
import { GetTrendDataUseCase } from '../application/services/GetTrendData.useCase';
import { CalculateHealthScoreUseCase } from '../application/services/CalculateHealthScore.useCase';
import { ListBadgesUseCase } from '../application/services/ListBadges.useCase';
import { GetPeriodReportUseCase } from '../application/services/GetPeriodReport.useCase';
import { CalculateBacUseCase } from '../application/services/CalculateBac.useCase';
import { SetProfileUseCase } from '../application/services/SetProfile.useCase';
import { GetProfileUseCase } from '../application/services/GetProfile.useCase';
import { CreateEntryDto } from './dto/CreateEntry.dto';
import { ListEntriesDto } from './dto/ListEntries.dto';
import { GetStatsDto } from './dto/GetStats.dto';
import { CreateGoalDto } from './dto/CreateGoal.dto';
import { GetTrendsDto } from './dto/GetTrends.dto';
import { GetPeriodReportDto } from './dto/GetPeriodReport.dto';
import { EntryResponseDto } from './dto/EntryResponse.dto';
import { GoalResponseDto } from './dto/GoalResponse.dto';
import { StatsResponseDto } from './dto/StatsResponse.dto';
import { TrendResponseDto } from './dto/TrendResponse.dto';
import { HealthScoreResponseDto } from './dto/HealthScoreResponse.dto';
import { BadgeStatusDto } from './dto/BadgeResponse.dto';
import { PeriodReportResponseDto } from './dto/PeriodReportResponse.dto';
import { BacResponseDto } from './dto/BacResponse.dto';
import { CreateProfileDto } from './dto/CreateProfile.dto';
import { ProfileResponseDto } from './dto/ProfileResponse.dto';

/**
 * Controleur REST du module Sebastian.
 *
 * Expose les endpoints pour la gestion des entrees de consommation,
 * des objectifs et des statistiques. Protege par le role 'sebastian'.
 */
@ApiTags('sebastian')
@ApiBearerAuth()
@Controller('sebastian')
@UseGuards(RolesGuard)
@Roles('sebastian')
export class SebastianController {
  constructor(
    private readonly addEntry: AddEntryUseCase,
    private readonly listEntries: ListEntriesUseCase,
    private readonly deleteEntry: DeleteEntryUseCase,
    private readonly getStats: GetStatsUseCase,
    private readonly setGoal: SetGoalUseCase,
    private readonly listGoals: ListGoalsUseCase,
    private readonly deleteGoal: DeleteGoalUseCase,
    private readonly getTrendData: GetTrendDataUseCase,
    private readonly calculateHealthScore: CalculateHealthScoreUseCase,
    private readonly listBadges: ListBadgesUseCase,
    private readonly getPeriodReport: GetPeriodReportUseCase,
    private readonly calculateBac: CalculateBacUseCase,
    private readonly setProfileUseCase: SetProfileUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
  ) {}

  @Post('entries')
  @ApiOperation({ summary: 'Ajouter une entree de consommation' })
  @ApiOkResponse({ type: EntryResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async createEntry(@Body() dto: CreateEntryDto, @Req() req: Request) {
    const user = req.user!;
    const entry = await this.addEntry.execute({
      userId: user.sub,
      category: dto.category,
      quantity: dto.quantity,
      date: dto.date,
      notes: dto.notes,
      drinkType: dto.drinkType,
      alcoholDegree: dto.alcoholDegree,
      volumeCl: dto.volumeCl,
    });
    return EntryResponseDto.fromDomain(entry);
  }

  @Get('entries')
  @ApiOperation({ summary: 'Lister les entrees de consommation' })
  @ApiOkResponse({ type: [EntryResponseDto] })
  async listAllEntries(@Query() dto: ListEntriesDto, @Req() req: Request) {
    const user = req.user!;
    const entries = await this.listEntries.execute({
      userId: user.sub,
      from: dto.from,
      to: dto.to,
      category: dto.category,
    });
    return entries.map((e) => EntryResponseDto.fromDomain(e));
  }

  @Delete('entries/:id')
  @ApiOperation({ summary: 'Supprimer une entree de consommation' })
  @ApiOkResponse({ description: 'Entree supprimee avec succes' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async removeEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user!;
    await this.deleteEntry.execute({ userId: user.sub, entryId: id });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtenir les statistiques de consommation' })
  @ApiOkResponse({ type: StatsResponseDto })
  async getStatistics(@Query() dto: GetStatsDto, @Req() req: Request) {
    const user = req.user!;
    const stats = await this.getStats.execute({
      userId: user.sub,
      period: dto.period as 'week' | 'month' | 'year',
    });
    return StatsResponseDto.fromResult(stats);
  }

  @Post('goals')
  @ApiOperation({ summary: 'Definir un objectif de consommation' })
  @ApiOkResponse({ type: GoalResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async createGoal(@Body() dto: CreateGoalDto, @Req() req: Request) {
    const user = req.user!;
    const goal = await this.setGoal.execute({
      userId: user.sub,
      category: dto.category,
      targetQuantity: dto.targetQuantity,
      period: dto.period,
    });
    return GoalResponseDto.fromDomain(goal);
  }

  @Get('goals')
  @ApiOperation({ summary: 'Lister les objectifs actifs' })
  @ApiOkResponse({ type: [GoalResponseDto] })
  async listAllGoals(@Req() req: Request) {
    const user = req.user!;
    const goals = await this.listGoals.execute(user.sub);
    return goals.map((g) => GoalResponseDto.fromDomain(g));
  }

  @Delete('goals/:id')
  @ApiOperation({ summary: 'Supprimer un objectif de consommation' })
  @ApiOkResponse({ description: 'Objectif supprime avec succes' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async removeGoal(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user!;
    await this.deleteGoal.execute({ userId: user.sub, goalId: id });
  }

  @Get('stats/trends')
  @ApiOperation({ summary: 'Obtenir les donnees de tendance' })
  @ApiOkResponse({ type: TrendResponseDto })
  async getTrends(@Query() dto: GetTrendsDto, @Req() req: Request) {
    const user = req.user!;
    const result = await this.getTrendData.execute({
      userId: user.sub,
      period: dto.period as '7d' | '30d',
    });
    return TrendResponseDto.fromResult(result);
  }

  @Get('stats/health-score')
  @ApiOperation({ summary: 'Obtenir le score de sante' })
  @ApiOkResponse({ type: HealthScoreResponseDto })
  async getHealthScore(@Req() req: Request) {
    const user = req.user!;
    const result = await this.calculateHealthScore.execute(user.sub);
    return HealthScoreResponseDto.fromResult(result);
  }

  @Get('stats/report')
  @ApiOperation({ summary: 'Obtenir un rapport de periode' })
  @ApiOkResponse({ type: PeriodReportResponseDto })
  async getReport(@Query() dto: GetPeriodReportDto, @Req() req: Request) {
    const user = req.user!;
    const result = await this.getPeriodReport.execute({
      userId: user.sub,
      period: dto.period as 'week' | 'month' | 'quarter',
      startDate: dto.startDate,
    });
    return PeriodReportResponseDto.fromResult(result);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Lister les badges et leur statut' })
  @ApiOkResponse({ type: [BadgeStatusDto] })
  async getAllBadges(@Req() req: Request) {
    const user = req.user!;
    const badges = await this.listBadges.execute(user.sub);
    return badges.map((b) => BadgeStatusDto.fromResult(b));
  }

  @Get('bac')
  @ApiOperation({ summary: "Obtenir le taux d'alcoolemie actuel" })
  @ApiOkResponse({ type: BacResponseDto })
  async getBac(@Req() req: Request) {
    const user = req.user!;
    const result = await this.calculateBac.execute({ userId: user.sub });
    return BacResponseDto.fromResult(result);
  }

  @Post('profile')
  @ApiOperation({ summary: 'Definir le profil pour le calcul BAC' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  async setProfile(@Body() dto: CreateProfileDto, @Req() req: Request) {
    const user = req.user!;
    const profile = await this.setProfileUseCase.execute({
      userId: user.sub,
      weightKg: dto.weightKg,
      widmarkR: dto.widmarkR,
    });
    return ProfileResponseDto.fromDomain(profile);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Obtenir le profil BAC' })
  @ApiOkResponse({ type: ProfileResponseDto })
  async getProfile(@Req() req: Request) {
    const user = req.user!;
    const profile = await this.getProfileUseCase.execute(user.sub);
    return ProfileResponseDto.fromDomain(profile);
  }
}
