import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { CreateBudgetGoalUseCase } from '../application/services/CreateBudgetGoal.useCase';
import { DeleteBudgetGoalUseCase } from '../application/services/DeleteBudgetGoal.useCase';
import { GetBudgetGoalsWithProgressUseCase } from '../application/services/GetBudgetGoalsWithProgress.useCase';
import { UpdateBudgetGoalUseCase } from '../application/services/UpdateBudgetGoal.useCase';
import type {
  BudgetGoal,
  BudgetGoalKind,
  BudgetGoalWithProgress,
} from '../domain/BudgetGoal';
import { BudgetGoalWithProgressResponseDto } from './dto/BudgetGoalWithProgress.response.dto';
import { CreateGoalDto } from './dto/CreateGoal.dto';
import { UpdateGoalDto } from './dto/UpdateGoal.dto';

/** Controller HTTP des objectifs de budget (CRUD + lecture enrichie progression). */
@ApiTags('budget')
@ApiBearerAuth()
@Controller('budget/goals')
@UseGuards(RolesGuard)
@Roles('budget')
export class BudgetGoalsController {
  constructor(
    private readonly createGoal: CreateBudgetGoalUseCase,
    private readonly getGoalsWithProgress: GetBudgetGoalsWithProgressUseCase,
    private readonly updateGoal: UpdateBudgetGoalUseCase,
    private readonly deleteGoal: DeleteBudgetGoalUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cree un objectif de budget' })
  @ApiOkResponse({ type: BudgetGoalWithProgressResponseDto })
  async create(
    @Body() dto: CreateGoalDto,
    @Req() req: Request,
  ): Promise<BudgetGoalWithProgressResponseDto> {
    const userId = (req.user as { sub: string }).sub;
    const goal = await this.createGoal.execute({
      groupId: dto.groupId,
      userId,
      name: dto.name,
      kind: dto.kind as BudgetGoalKind,
      targetAmount: dto.targetAmount,
      categoryId: dto.categoryId ?? null,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
    });
    return this.toResponseFromGoal(goal);
  }

  @Get()
  @ApiOperation({ summary: 'Liste les objectifs avec progression actuelle' })
  @ApiOkResponse({ type: BudgetGoalWithProgressResponseDto, isArray: true })
  async list(
    @Query('groupId', new ParseUUIDPipe()) groupId: string,
    @Query('month') monthRaw: string | undefined,
    @Query('year') yearRaw: string | undefined,
    @Req() req: Request,
  ): Promise<BudgetGoalWithProgressResponseDto[]> {
    const userId = (req.user as { sub: string }).sub;
    const now = new Date();
    const month = monthRaw ? parseInt(monthRaw, 10) : now.getMonth() + 1;
    const year = yearRaw ? parseInt(yearRaw, 10) : now.getFullYear();
    const goals = await this.getGoalsWithProgress.execute({
      groupId,
      userId,
      month,
      year,
    });
    return goals.map((g) => this.toResponseFromProgress(g));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Met a jour un objectif' })
  @ApiOkResponse({ type: BudgetGoalWithProgressResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) goalId: string,
    @Body() dto: UpdateGoalDto,
    @Req() req: Request,
  ): Promise<BudgetGoalWithProgressResponseDto> {
    const userId = (req.user as { sub: string }).sub;
    const updated = await this.updateGoal.execute({
      goalId,
      userId,
      patch: {
        name: dto.name,
        kind: dto.kind as BudgetGoalKind | undefined,
        targetAmount: dto.targetAmount,
        categoryId: dto.categoryId,
        deadline: dto.deadline
          ? new Date(dto.deadline)
          : (dto.deadline as null | undefined),
        isActive: dto.isActive,
      },
    });
    return this.toResponseFromGoal(updated);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un objectif' })
  async remove(
    @Param('id', new ParseUUIDPipe()) goalId: string,
    @Req() req: Request,
  ): Promise<void> {
    const userId = (req.user as { sub: string }).sub;
    await this.deleteGoal.execute({ goalId, userId });
  }

  private toResponseFromGoal(g: BudgetGoal): BudgetGoalWithProgressResponseDto {
    return this.mapBase(g, 0, 0);
  }

  private toResponseFromProgress(
    g: BudgetGoalWithProgress,
  ): BudgetGoalWithProgressResponseDto {
    return this.mapBase(g, g.currentAmount, g.progressPercent);
  }

  private mapBase(
    g: BudgetGoal,
    currentAmount: number,
    progressPercent: number,
  ): BudgetGoalWithProgressResponseDto {
    return {
      id: g.id ?? '',
      groupId: g.groupId,
      createdByUserId: g.createdByUserId,
      name: g.name,
      kind: g.kind,
      targetAmount: g.targetAmount,
      categoryId: g.categoryId,
      deadline: g.deadline ? g.deadline.toISOString() : null,
      isActive: g.isActive,
      currentAmount,
      progressPercent,
      createdAt: (g.createdAt ?? new Date()).toISOString(),
      updatedAt: (g.updatedAt ?? new Date()).toISOString(),
    };
  }
}
