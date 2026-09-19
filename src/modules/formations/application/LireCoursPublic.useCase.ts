import { Inject, Injectable } from '@nestjs/common';
import { tirer } from '../domain/cours/Tirage';
import type { CoursPublic } from '../domain/contrats/tirage';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { CoursInconnuError } from '../domain/errors/FormationErrors';
import { CATALOGUE_COURS } from '../domain/token';

@Injectable()
export class LireCoursPublicUseCase {
  constructor(
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(slug: string): Promise<CoursPublic> {
    const cours = await this.catalogue.trouver(slug);
    if (cours === null) {
      throw new CoursInconnuError(slug);
    }
    return tirer(cours, 0).sujet;
  }
}
