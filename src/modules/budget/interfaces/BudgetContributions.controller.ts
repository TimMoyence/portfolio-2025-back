import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  ParseUUIDPipe,
  Put,
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
import { GetBudgetContributionsUseCase } from '../application/services/GetBudgetContributions.useCase';
import { UpsertMyBudgetContributionUseCase } from '../application/services/UpsertMyBudgetContribution.useCase';
import type { BudgetMemberContribution } from '../domain/BudgetMemberContribution';
import { BudgetContributionResponseDto } from './dto/BudgetContribution.response.dto';
import { UpsertContributionDto } from './dto/UpsertContribution.dto';

/**
 * Controller HTTP des contributions mensuelles des membres.
 *
 * GET /budget/contributions : liste les contributions du groupe pour un
 * mois/annee. Visible par tout membre (transparence totale).
 *
 * PUT /budget/contributions : upsert la contribution du userId issu du JWT.
 * Le body NE contient JAMAIS un userId : un membre ne peut modifier que
 * sa propre contribution par construction.
 */
@ApiTags('budget')
@ApiBearerAuth()
@Controller('budget/contributions')
@UseGuards(RolesGuard)
@Roles('budget')
export class BudgetContributionsController {
  constructor(
    private readonly getContribs: GetBudgetContributionsUseCase,
    private readonly upsertContrib: UpsertMyBudgetContributionUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Liste les contributions du groupe pour une periode',
  })
  @ApiOkResponse({ type: BudgetContributionResponseDto, isArray: true })
  async list(
    @Query('groupId', new ParseUUIDPipe()) groupId: string,
    @Query('month', new ParseIntPipe()) month: number,
    @Query('year', new ParseIntPipe()) year: number,
    @Req() req: Request,
  ): Promise<BudgetContributionResponseDto[]> {
    const userId = (req.user as { sub: string }).sub;
    const contribs = await this.getContribs.execute({
      groupId,
      month,
      year,
      userId,
    });
    return contribs.map((c) => this.toResponse(c));
  }

  @Put()
  @ApiOperation({ summary: 'Upsert ma contribution mensuelle' })
  @ApiOkResponse({ type: BudgetContributionResponseDto })
  async upsert(
    @Body() dto: UpsertContributionDto,
    @Req() req: Request,
  ): Promise<BudgetContributionResponseDto> {
    const userId = (req.user as { sub: string }).sub;
    const contrib = await this.upsertContrib.execute({
      groupId: dto.groupId,
      month: dto.month,
      year: dto.year,
      monthlySalary: dto.monthlySalary,
      userId,
    });
    return this.toResponse(contrib);
  }

  private toResponse(
    c: BudgetMemberContribution,
  ): BudgetContributionResponseDto {
    return {
      id: c.id ?? '',
      groupId: c.groupId,
      userId: c.userId,
      month: c.month,
      year: c.year,
      monthlySalary: c.monthlySalary,
      createdAt: (c.createdAt ?? new Date()).toISOString(),
      updatedAt: (c.updatedAt ?? new Date()).toISOString(),
    };
  }
}
