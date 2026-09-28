import { Inject, Injectable } from '@nestjs/common';
import { projeterCatalogue } from '../domain/cours/Diffusion';
import type { CoursPublicCatalogue } from '../domain/contrats/tirage';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { CATALOGUE_COURS } from '../domain/token';
import { coursPublieOuInconnu } from './coursPublieOuInconnu';

@Injectable()
export class LireCoursPublicUseCase {
  constructor(
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(slug: string): Promise<CoursPublicCatalogue> {
    const publie = await coursPublieOuInconnu(this.catalogue, slug);
    return {
      ...projeterCatalogue(publie.cours),
      version: publie.version,
      publieLe: publie.publieLe.toISOString(),
    };
  }
}
