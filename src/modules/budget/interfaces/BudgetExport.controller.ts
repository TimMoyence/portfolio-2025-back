import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { ExportBudgetPdfUseCase } from '../application/services/ExportBudgetPdf.useCase';
import { ExportBudgetPdfQueryDto } from './dto/ExportBudgetPdfQuery.dto';

/**
 * Sous-controleur REST pour l'export PDF du module Budget.
 *
 * Expose l'endpoint d'export du budget mensuel en PDF.
 * Protege par le role 'budget'.
 */
@ApiTags('budget')
@ApiBearerAuth()
@Controller('budget')
@UseGuards(RolesGuard)
@Roles('budget')
export class BudgetExportController {
  constructor(private readonly exportPdf: ExportBudgetPdfUseCase) {}

  @Get('export/pdf')
  @ApiOperation({ summary: 'Exporter le budget mensuel en PDF' })
  @ApiOkResponse({ description: 'Fichier PDF du budget mensuel' })
  @ApiBadRequestResponse({
    description: 'Query invalide (groupId UUID, month 1-12, year 2000-2100)',
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async exportBudgetPdf(
    @Query() query: ExportBudgetPdfQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user!;
    const buffer = await this.exportPdf.execute({
      userId: user.sub,
      groupId: query.groupId,
      month: query.month,
      year: query.year,
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="budget-${query.month}-${query.year}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
