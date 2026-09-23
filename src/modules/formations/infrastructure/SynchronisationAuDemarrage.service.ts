import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { SynchroniserCoursUseCase } from '../application/SynchroniserCours.useCase';
import type { ContenuAPublier } from '../domain/cours/CoursStocke';
import { CONTENUS_DES_COURS } from '../domain/token';

@Injectable()
export class SynchronisationAuDemarrageService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SynchronisationAuDemarrageService.name);

  constructor(
    private readonly synchroniser: SynchroniserCoursUseCase,
    @Inject(CONTENUS_DES_COURS)
    private readonly contenus: readonly ContenuAPublier[],
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.publierLesCoursDuDepot();
    } catch (erreur) {
      const cause =
        erreur instanceof Error ? erreur : new Error(String(erreur));
      this.logger.error(
        `Synchronisation des cours échouée, la dernière version publiée reste servie : ${cause.message}`,
        cause.stack ?? cause.message,
      );
    }
  }

  private async publierLesCoursDuDepot(): Promise<void> {
    const issues = await this.synchroniser.execute(this.contenus);
    for (const issue of issues) {
      this.logger.log(
        issue.statut === 'publie'
          ? `Cours ${issue.slug} publié en version ${String(issue.version)}`
          : `Cours ${issue.slug} déjà à jour`,
      );
    }
  }
}
