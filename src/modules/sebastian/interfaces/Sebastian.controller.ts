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
import { CreateEntryDto } from './dto/CreateEntry.dto';
import { ListEntriesDto } from './dto/ListEntries.dto';
import { GetStatsDto } from './dto/GetStats.dto';
import { CreateGoalDto } from './dto/CreateGoal.dto';
import { EntryResponseDto } from './dto/EntryResponse.dto';
import { GoalResponseDto } from './dto/GoalResponse.dto';
import { StatsResponseDto } from './dto/StatsResponse.dto';

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
}
