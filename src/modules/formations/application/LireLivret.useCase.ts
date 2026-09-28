import { Inject, Injectable } from '@nestjs/common';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { livretDuCours, type LivretPublie } from '../domain/cours/Livret';
import { CoursInconnuError } from '../domain/errors/FormationErrors';
import { CATALOGUE_COURS } from '../domain/token';

@Injectable()
export class LireLivretUseCase {
  constructor(
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(slug: string): Promise<LivretPublie> {
    const publie = await this.catalogue.trouverCourant(slug);
    if (publie === null) {
      throw new CoursInconnuError(slug);
    }
    return { version: publie.version, ...livretDuCours(publie.cours) };
  }
}
