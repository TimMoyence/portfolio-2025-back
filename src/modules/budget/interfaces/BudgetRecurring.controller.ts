import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { BudgetEntryMapper } from '../application/mappers/BudgetEntryMapper';
import { RecurringEntryMapper } from '../application/mappers/RecurringEntryMapper';
import { CreateRecurringEntryUseCase } from '../application/services/CreateRecurringEntry.useCase';
import { GetRecurringEntriesUseCase } from '../application/services/GetRecurringEntries.useCase';
import { UpdateRecurringEntryUseCase } from '../application/services/UpdateRecurringEntry.useCase';
import { DeleteRecurringEntryUseCase } from '../application/services/DeleteRecurringEntry.useCase';
import { ApplyRecurringEntriesUseCase } from '../application/services/ApplyRecurringEntries.useCase';
import { BudgetEntryResponseDto } from './dto/BudgetEntry.response.dto';
import { CreateRecurringEntryDto } from './dto/CreateRecurringEntry.dto';
import { UpdateRecurringEntryDto } from './dto/UpdateRecurringEntry.dto';
import { ApplyRecurringEntriesDto } from './dto/ApplyRecurringEntries.dto';
import { RecurringEntryResponseDto } from './dto/RecurringEntry.response.dto';

/**
 * Sous-controleur REST pour les entrees recurrentes du module Budget.
 *
 * Expose les 5 endpoints CRUD + application des recurring entries.
 * Protege par le role 'budget'.
 */
@ApiTags('budget')
@ApiBearerAuth()
@Controller('budget')
@UseGuards(RolesGuard)
@Roles('budget')
export class BudgetRecurringController {
  constructor(
    private readonly createRecurring: CreateRecurringEntryUseCase,
    private readonly getRecurring: GetRecurringEntriesUseCase,
    private readonly updateRecurring: UpdateRecurringEntryUseCase,
    private readonly deleteRecurring: DeleteRecurringEntryUseCase,
    private readonly applyRecurring: ApplyRecurringEntriesUseCase,
  ) {}

  @Post('recurring-entries')
  @ApiOperation({ summary: 'Creer une entree recurrente de budget' })
  @ApiOkResponse({ type: RecurringEntryResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async createRecurringEntry(
    @Body() dto: CreateRecurringEntryDto,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const entry = await this.createRecurring.execute({
      userId: user.sub,
      groupId: dto.groupId,
      categoryId: dto.categoryId ?? null,
      description: dto.description,
      amount: dto.amount,
      type: dto.type,
      frequency: dto.frequency,
      dayOfMonth: dto.dayOfMonth ?? null,
      dayOfWeek: dto.dayOfWeek ?? null,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    });
    return RecurringEntryMapper.toResponse(entry);
  }

  @Get('recurring-entries')
  @ApiOperation({ summary: 'Lister les entrees recurrentes du groupe' })
  @ApiQuery({ name: 'groupId', required: true })
  @ApiOkResponse({ type: [RecurringEntryResponseDto] })
  async listRecurringEntries(
    @Query('groupId') groupId: string,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const entries = await this.getRecurring.execute(groupId, user.sub);
    return entries.map((e) => RecurringEntryMapper.toResponse(e));
  }

  @Patch('recurring-entries/:id')
  @ApiOperation({ summary: 'Mettre a jour une entree recurrente' })
  @ApiOkResponse({ type: RecurringEntryResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async updateRecurringEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecurringEntryDto,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const entry = await this.updateRecurring.execute({
      userId: user.sub,
      entryId: id,
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.frequency !== undefined && { frequency: dto.frequency }),
      ...(dto.dayOfMonth !== undefined && { dayOfMonth: dto.dayOfMonth }),
      ...(dto.dayOfWeek !== undefined && { dayOfWeek: dto.dayOfWeek }),
      ...(dto.startDate !== undefined && {
        startDate: new Date(dto.startDate),
      }),
      ...(dto.endDate !== undefined && {
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });
    return RecurringEntryMapper.toResponse(entry);
  }

  @Delete('recurring-entries/:id')
  @ApiOperation({ summary: 'Supprimer une entree recurrente' })
  @ApiOkResponse({ description: 'Entree recurrente supprimee avec succes' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async deleteRecurringEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user!;
    await this.deleteRecurring.execute({ userId: user.sub, entryId: id });
  }

  @Post('recurring-entries/apply')
  @ApiOperation({ summary: 'Appliquer les entrees recurrentes pour un mois' })
  @ApiOkResponse({ type: [BudgetEntryResponseDto] })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async applyRecurringEntries(
    @Body() dto: ApplyRecurringEntriesDto,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const entries = await this.applyRecurring.execute({
      userId: user.sub,
      groupId: dto.groupId,
      month: dto.month,
      year: dto.year,
    });
    return entries.map((e) => BudgetEntryMapper.toResponse(e));
  }
}
