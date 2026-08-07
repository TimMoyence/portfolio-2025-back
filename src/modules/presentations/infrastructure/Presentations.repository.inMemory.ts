import { Injectable } from '@nestjs/common';
import { IPresentationsRepository } from '../domain/IPresentations.repository';
import {
  PresentationInteractions,
  SlideInteractions,
} from '../domain/SlideInteraction';
import { IA_SOLOPRENEURS_INTERACTIONS } from './data/ia-solopreneurs.interactions';

@Injectable()
export class PresentationsRepositoryInMemory implements IPresentationsRepository {
  private readonly store = new Map<string, Record<string, SlideInteractions>>();

  constructor() {
    this.store.set('ia-solopreneurs', IA_SOLOPRENEURS_INTERACTIONS);
  }

  findBySlug(slug: string): Promise<PresentationInteractions | null> {
    const interactions = this.store.get(slug);
    if (!interactions) return Promise.resolve(null);
    return Promise.resolve({ slug, interactions });
  }
}
