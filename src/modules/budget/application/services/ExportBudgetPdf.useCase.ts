import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import type { IBudgetCategoryRepository } from '../../domain/IBudgetCategory.repository';
import type { IBudgetEntryRepository } from '../../domain/IBudgetEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { IBudgetPdfRenderer } from '../../domain/IBudgetPdfRenderer';
import {
  BUDGET_CATEGORY_REPOSITORY,
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
  BUDGET_PDF_RENDERER,
} from '../../domain/token';
import type { ExportBudgetPdfCommand } from '../dto/ExportBudgetPdf.command';

/**
 * Orchestrateur de l'export PDF du budget mensuel.
 *
 * Verifie l'appartenance au groupe, charge les entries et categories,
 * puis delegue le rendu effectif a un {@link IBudgetPdfRenderer}.
 * Aucune dependance directe a une librairie de PDF : permet de remplacer
 * pdfkit par toute autre implementation sans toucher au use case.
 */
@Injectable()
export class ExportBudgetPdfUseCase {
  constructor(
    @Inject(BUDGET_ENTRY_REPOSITORY)
    private readonly entryRepo: IBudgetEntryRepository,
    @Inject(BUDGET_CATEGORY_REPOSITORY)
    private readonly categoryRepo: IBudgetCategoryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
    @Inject(BUDGET_PDF_RENDERER)
    private readonly renderer: IBudgetPdfRenderer,
  ) {}

  async execute(command: ExportBudgetPdfCommand): Promise<Buffer> {
    const isMember = await this.groupRepo.isMember(
      command.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }

    const [entries, categories] = await Promise.all([
      this.entryRepo.findByFilters({
        groupId: command.groupId,
        month: command.month,
        year: command.year,
      }),
      this.categoryRepo.findByGroupId(command.groupId),
    ]);

    return this.renderer.render({
      command,
      entries,
      categories,
      generatedAt: new Date(),
    });
  }
}
