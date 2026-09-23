import { Inject, Injectable } from '@nestjs/common';
import {
  type ContenuAPublier,
  lireContenuAPublier,
} from '../domain/cours/CoursStocke';
import { empreinteCanonique } from '../domain/cours/EmpreinteCanonique';
import type { IPublicationDesCours } from '../domain/cours/IPublicationDesCours.port';
import { verifierStructure } from '../domain/cours/StructureCours';
import { CoursNonConformeError } from '../domain/errors/FormationErrors';
import { PUBLICATION_DES_COURS } from '../domain/token';

export type IssueDeSynchronisation =
  | { readonly slug: string; readonly statut: 'a-jour' }
  | {
      readonly slug: string;
      readonly statut: 'publie';
      readonly version: number;
    };

function assertPubliable(contenu: ContenuAPublier): void {
  const violations = verifierStructure(lireContenuAPublier(contenu));
  if (violations.length > 0) {
    throw new CoursNonConformeError(
      contenu.slug,
      violations.map(
        ({ regle, ecran, raison }) =>
          `${regle} (${ecran ?? 'cours'}) : ${raison}`,
      ),
    );
  }
}

@Injectable()
export class SynchroniserCoursUseCase {
  constructor(
    @Inject(PUBLICATION_DES_COURS)
    private readonly publication: IPublicationDesCours,
  ) {}

  async execute(
    contenus: readonly ContenuAPublier[],
  ): Promise<readonly IssueDeSynchronisation[]> {
    contenus.forEach(assertPubliable);
    const issues: IssueDeSynchronisation[] = [];
    for (const contenu of contenus) {
      issues.push(await this.synchroniser(contenu));
    }
    return issues;
  }

  private async synchroniser(
    contenu: ContenuAPublier,
  ): Promise<IssueDeSynchronisation> {
    const empreinte = empreinteCanonique(contenu);
    if ((await this.publication.empreintePubliee(contenu.slug)) === empreinte) {
      return { slug: contenu.slug, statut: 'a-jour' };
    }
    const version = await this.publication.publier(contenu, empreinte);
    return { slug: contenu.slug, statut: 'publie', version };
  }
}
