import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IPresentationsRepository } from '../domain/IPresentations.repository';
import type { PresentationInteractions } from '../domain/SlideInteraction';
import { PRESENTATIONS_REPOSITORY } from '../domain/token';

/**
 * Cas d'utilisation : récupérer les interactions d'une présentation.
 *
 * Retourne la map slideId → SlideInteractions pour une présentation
 * identifiée par son slug. Lève NotFoundException si le slug est inconnu.
 */
@Injectable()
export class GetPresentationInteractionsUseCase {
  constructor(
    @Inject(PRESENTATIONS_REPOSITORY)
    private readonly repo: IPresentationsRepository,
  ) {}

  async execute(slug: string): Promise<PresentationInteractions> {
    const result = await this.repo.findBySlug(slug);
    if (!result) {
      throw new NotFoundException(
        `Aucune interaction trouvée pour la présentation « ${slug} »`,
      );
    }
    return result;
  }
}
