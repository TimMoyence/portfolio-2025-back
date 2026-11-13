import { Inject, Injectable } from '@nestjs/common';
import { RefusDuDestinataire } from '../../../../common/domain/errors/RefusDuDestinataire';
import {
  BUDGET_DES_ENVOIS,
  type BudgetDesEnvois,
} from '../../../../common/application/budget-des-envois';
import {
  type DestinataireDeDiffusion,
  type DiffusionDue,
  DIFFUSIONS_REPOSITORY,
  type IDiffusionsRepository,
  type IMailerDesArticles,
  MAILER_DES_ARTICLES,
} from './diffusions.repository';

export const TAILLE_D_UN_LOT = 50;
const DELAI_D_ABANDON_D_UNE_RESERVATION_MS = 10 * 60_000;

@Injectable()
export class EnvoyerLesDiffusionsDuesUseCase {
  constructor(
    @Inject(DIFFUSIONS_REPOSITORY)
    private readonly diffusions: IDiffusionsRepository,
    @Inject(MAILER_DES_ARTICLES)
    private readonly mailer: IMailerDesArticles,
    @Inject(BUDGET_DES_ENVOIS)
    private readonly budget: BudgetDesEnvois,
  ) {}

  async executer(maintenant: Date): Promise<void> {
    await this.diffusions.libererLesReservationsAbandonnees(
      new Date(maintenant.getTime() - DELAI_D_ABANDON_D_UNE_RESERVATION_MS),
    );
    const taille = Math.min(
      TAILLE_D_UN_LOT,
      await this.budget.restantPourLaDiffusion(maintenant),
    );
    if (taille <= 0) {
      return;
    }
    const diffusion = await this.diffusions.prendreLaProchaineDue(maintenant);
    if (diffusion === null) {
      return;
    }
    const destinataires = await this.diffusions.destinatairesEnAttente(
      diffusion.id,
      diffusion.article.locale,
      taille,
    );
    for (const destinataire of destinataires) {
      if (await this.diffusions.reserver(diffusion.id, destinataire.abonneId)) {
        await this.envoyerA(diffusion, destinataire);
      }
    }
    if (destinataires.length < taille) {
      await this.diffusions.cloturer(diffusion.id);
    }
  }

  private async envoyerA(
    diffusion: DiffusionDue,
    destinataire: DestinataireDeDiffusion,
  ): Promise<void> {
    try {
      await this.mailer.envoyerLArticle(diffusion.article, destinataire);
    } catch (refus: unknown) {
      if (refus instanceof RefusDuDestinataire) {
        await this.diffusions.marquerRefuse(
          diffusion.id,
          destinataire.abonneId,
        );
        return;
      }
      await this.diffusions.liberer(diffusion.id, destinataire.abonneId);
      throw refus;
    }
    await this.diffusions.marquerEnvoye(diffusion.id, destinataire.abonneId);
  }
}
