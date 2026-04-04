import {
  Body,
  Controller,
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
import { BudgetCategoryMapper } from '../application/mappers/BudgetCategoryMapper';
import { BudgetEntryMapper } from '../application/mappers/BudgetEntryMapper';
import { BudgetGroupMapper } from '../application/mappers/BudgetGroupMapper';
import { CreateBudgetCategoryUseCase } from '../application/services/CreateBudgetCategory.useCase';
import { CreateBudgetEntryUseCase } from '../application/services/CreateBudgetEntry.useCase';
import { CreateBudgetGroupUseCase } from '../application/services/CreateBudgetGroup.useCase';
import { GetBudgetCategoriesUseCase } from '../application/services/GetBudgetCategories.useCase';
import { GetBudgetGroupsUseCase } from '../application/services/GetBudgetGroups.useCase';
import { GetBudgetEntriesUseCase } from '../application/services/GetBudgetEntries.useCase';
import { GetBudgetSummaryUseCase } from '../application/services/GetBudgetSummary.useCase';
import { ImportBudgetEntriesUseCase } from '../application/services/ImportBudgetEntries.useCase';
import { UpdateBudgetEntryUseCase } from '../application/services/UpdateBudgetEntry.useCase';
import { ShareBudgetUseCase } from '../application/services/ShareBudget.useCase';
import { BudgetCategoryResponseDto } from './dto/BudgetCategory.response.dto';
import { BudgetEntryResponseDto } from './dto/BudgetEntry.response.dto';
import { BudgetGroupResponseDto } from './dto/BudgetGroup.response.dto';
import { BudgetSummaryResponseDto } from './dto/BudgetSummary.response.dto';
import { CreateBudgetCategoryDto } from './dto/CreateBudgetCategory.dto';
import { CreateBudgetEntryDto } from './dto/CreateBudgetEntry.dto';
import { CreateBudgetGroupDto } from './dto/CreateBudgetGroup.dto';
import { ImportBudgetEntriesDto } from './dto/ImportBudgetEntries.dto';
import { ShareBudgetDto } from './dto/ShareBudget.dto';
import { UpdateBudgetEntryDto } from './dto/UpdateBudgetEntry.dto';

/**
 * Controleur REST du module Budget.
 *
 * Expose 8 endpoints pour la gestion des groupes, entrees,
 * categories et le partage de budget. Protege par le role 'budget'.
 */
@ApiTags('budget')
@ApiBearerAuth()
@Controller('budget')
@UseGuards(RolesGuard)
@Roles('budget')
export class BudgetController {
  constructor(
    private readonly createGroup: CreateBudgetGroupUseCase,
    private readonly getGroups: GetBudgetGroupsUseCase,
    private readonly createEntry: CreateBudgetEntryUseCase,
    private readonly getEntries: GetBudgetEntriesUseCase,
    private readonly getSummary: GetBudgetSummaryUseCase,
    private readonly importEntries: ImportBudgetEntriesUseCase,
    private readonly updateEntry: UpdateBudgetEntryUseCase,
    private readonly createCategory: CreateBudgetCategoryUseCase,
    private readonly getCategories: GetBudgetCategoriesUseCase,
    private readonly shareBudget: ShareBudgetUseCase,
  ) {}

  @Post('groups')
  @ApiOperation({ summary: 'Creer un groupe de budget' })
  @ApiOkResponse({ type: BudgetGroupResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async createBudgetGroup(
    @Body() dto: CreateBudgetGroupDto,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const group = await this.createGroup.execute({
      name: dto.name,
      userId: user.sub,
    });
    return BudgetGroupMapper.toResponse(group);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Lister les groupes de budget du user' })
  @ApiOkResponse({ type: [BudgetGroupResponseDto] })
  async listBudgetGroups(@Req() req: Request) {
    const user = req.user!;
    const groups = await this.getGroups.execute(user.sub);
    return groups.map((g) => BudgetGroupMapper.toResponse(g));
  }

  @Post('entries')
  @ApiOperation({ summary: 'Creer une entree de budget' })
  @ApiOkResponse({ type: BudgetEntryResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async createBudgetEntry(
    @Body() dto: CreateBudgetEntryDto,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const entry = await this.createEntry.execute({
      userId: user.sub,
      groupId: dto.groupId,
      categoryId: dto.categoryId,
      date: dto.date,
      description: dto.description,
      amount: dto.amount,
      type: dto.type,
      state: dto.state,
    });
    return BudgetEntryMapper.toResponse(entry);
  }

  @Patch('entries/:id')
  @ApiOperation({ summary: "Mettre a jour la categorie d'une entree" })
  @ApiOkResponse({ type: BudgetEntryResponseDto })
  async updateBudgetEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetEntryDto,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const entry = await this.updateEntry.execute({
      userId: user.sub,
      entryId: id,
      categoryId: dto.categoryId,
    });
    return BudgetEntryMapper.toResponse(entry);
  }

  @Get('entries')
  @ApiOperation({ summary: 'Lister les entrees de budget filtrees' })
  @ApiQuery({ name: 'groupId', required: true })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiOkResponse({ type: [BudgetEntryResponseDto] })
  async listBudgetEntries(
    @Query('groupId') groupId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('category') categoryId?: string,
    @Req() req?: Request,
  ) {
    const user = req!.user!;
    const entries = await this.getEntries.execute({
      userId: user.sub,
      groupId,
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
      categoryId,
    });
    return entries.map((e) => BudgetEntryMapper.toResponse(e));
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resume mensuel par categorie' })
  @ApiQuery({ name: 'groupId', required: true })
  @ApiQuery({ name: 'month', required: true })
  @ApiQuery({ name: 'year', required: true })
  @ApiOkResponse({ type: BudgetSummaryResponseDto })
  async budgetSummary(
    @Query('groupId') groupId: string,
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: Request,
  ) {
    const user = req.user!;
    return this.getSummary.execute({
      userId: user.sub,
      groupId,
      month: parseInt(month, 10),
      year: parseInt(year, 10),
    });
  }

  @Post('entries/import')
  @ApiOperation({ summary: 'Importer des entrees depuis un CSV' })
  @ApiOkResponse({ type: [BudgetEntryResponseDto] })
  @ApiBadRequestResponse({ description: 'Format CSV invalide' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async importBudgetEntries(
    @Body() dto: ImportBudgetEntriesDto,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const entries = await this.importEntries.execute({
      userId: user.sub,
      groupId: dto.groupId,
      csvContent: dto.csvContent,
    });
    return entries.map((e) => BudgetEntryMapper.toResponse(e));
  }

  @Post('categories')
  @ApiOperation({ summary: 'Creer une categorie personnalisee' })
  @ApiOkResponse({ type: BudgetCategoryResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async createBudgetCategory(
    @Body() dto: CreateBudgetCategoryDto,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const category = await this.createCategory.execute({
      userId: user.sub,
      groupId: dto.groupId,
      name: dto.name,
      color: dto.color,
      icon: dto.icon,
      budgetType: dto.budgetType,
      budgetLimit: dto.budgetLimit,
    });
    return BudgetCategoryMapper.toResponse(category);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lister les categories (defaut + custom)' })
  @ApiQuery({ name: 'groupId', required: true })
  @ApiOkResponse({ type: [BudgetCategoryResponseDto] })
  async listBudgetCategories(
    @Query('groupId') groupId: string,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const categories = await this.getCategories.execute({
      userId: user.sub,
      groupId,
    });
    return categories.map((c) => BudgetCategoryMapper.toResponse(c));
  }

  @Post('share')
  @ApiOperation({ summary: 'Partager le budget avec un autre utilisateur' })
  @ApiOkResponse({ description: 'Budget partage avec succes' })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async shareBudgetGroup(@Body() dto: ShareBudgetDto, @Req() req: Request) {
    const user = req.user!;
    return this.shareBudget.execute({
      userId: user.sub,
      groupId: dto.groupId,
      targetEmail: dto.targetEmail,
    });
  }
}
