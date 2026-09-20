import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../common/domain/errors/InsufficientPermissionsError';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { ouvrirTirages } from '../domain/cours/OuvertureTirages';
import { VersionNonPubliableError } from '../domain/errors/FormationErrors';
import { ROLE_ADMINISTRATEUR } from '../domain/SessionOwnership';
import type { ActeurFormation } from '../domain/SessionOwnership';
import { CATALOGUE_COURS } from '../domain/token';

export interface PublicationPubliee {
  slug: string;
  versionPubliee: number;
  publieeLe: string;
}

export function assertAdministrateur(acteur: ActeurFormation): void {
  if (!acteur.roles.includes(ROLE_ADMINISTRATEUR)) {
    throw new InsufficientPermissionsError(
      'Seul un administrateur publie une version de cours.',
    );
  }
}

@Injectable()
export class PublierVersionUseCase {
  constructor(
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(
    slug: string,
    version: number,
    acteur: ActeurFormation,
  ): Promise<PublicationPubliee> {
    assertAdministrateur(acteur);
    const cours = await this.catalogue.trouver(slug, version);
    if (cours === null) {
      throw new VersionNonPubliableError(slug, version, 'version inconnue');
    }
    try {
      ouvrirTirages(cours, undefined, version);
    } catch (erreur) {
      throw new VersionNonPubliableError(
        slug,
        version,
        erreur instanceof Error ? erreur.message : String(erreur),
      );
    }
    const publiee = await this.catalogue.publier({
      slug,
      version,
      parQui: acteur.id,
    });
    return {
      slug,
      versionPubliee: publiee.version,
      publieeLe: publiee.publieLe.toISOString(),
    };
  }
}
