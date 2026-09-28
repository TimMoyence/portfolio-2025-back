import { Inject, Injectable } from '@nestjs/common';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { livretDuCours, type LivretPublie } from '../domain/cours/Livret';
import { CATALOGUE_COURS } from '../domain/token';
import { coursPublieOuInconnu } from './coursPublieOuInconnu';

@Injectable()
export class LireLivretUseCase {
  constructor(
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(slug: string): Promise<LivretPublie> {
    const publie = await coursPublieOuInconnu(this.catalogue, slug);
    return { version: publie.version, ...livretDuCours(publie.cours) };
  }
}
