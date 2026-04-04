import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { ExportBudgetPdfUseCase } from '../application/services/ExportBudgetPdf.useCase';

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
  @ApiQuery({ name: 'groupId', required: true })
  @ApiQuery({ name: 'month', required: true })
  @ApiQuery({ name: 'year', required: true })
  @ApiOkResponse({ description: 'Fichier PDF du budget mensuel' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async exportBudgetPdf(
    @Query('groupId') groupId: string,
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user!;
    const buffer = await this.exportPdf.execute({
      userId: user.sub,
      groupId,
      month: parseInt(month, 10),
      year: parseInt(year, 10),
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="budget-${month}-${year}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
