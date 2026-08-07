import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../common/domain/errors/ResourceNotFoundError';
import type { IPresentationsRepository } from '../domain/IPresentations.repository';
import type { PresentationInteractions } from '../domain/SlideInteraction';
import { PRESENTATIONS_REPOSITORY } from '../domain/token';

@Injectable()
export class GetPresentationInteractionsUseCase {
  constructor(
    @Inject(PRESENTATIONS_REPOSITORY)
    private readonly repo: IPresentationsRepository,
  ) {}

  async execute(slug: string): Promise<PresentationInteractions> {
    const result = await this.repo.findBySlug(slug);
    if (!result) {
      throw new ResourceNotFoundError(
        `Aucune interaction trouvée pour la présentation « ${slug} »`,
      );
    }
    return result;
  }
}
