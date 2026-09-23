import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  DIFFUSION_PAR_DEFAUT,
  type ContenuAPublier,
} from '../domain/cours/CoursStocke';
import type { IPublicationDesCours } from '../domain/cours/IPublicationDesCours.port';
import { FormationCourseContentEntity } from './entities/FormationCourseContent.entity';
import { FormationCoursePublicationEntity } from './entities/FormationCoursePublication.entity';
import { FormationScreenContentEntity } from './entities/FormationScreenContent.entity';

interface LigneEmpreinte {
  empreinte: string | null;
}

interface LigneVersion {
  derniere: number | null;
}

async function lireEmpreintePubliee(
  manager: EntityManager,
  slug: string,
): Promise<string | null> {
  const lignes: LigneEmpreinte[] = await manager.query(
    `SELECT c."empreinte" FROM "formation_course_publications" p
     JOIN "formation_course_contents" c
       ON c."slug" = p."slug" AND c."version" = p."version_publiee"
     WHERE p."slug" = $1`,
    [slug],
  );
  return lignes[0]?.empreinte ?? null;
}

@Injectable()
export class PublicationDesCoursRepositoryTypeORM implements IPublicationDesCours {
  constructor(
    @InjectRepository(FormationCourseContentEntity)
    private readonly repo: Repository<FormationCourseContentEntity>,
  ) {}

  async empreintePubliee(slug: string): Promise<string | null> {
    return lireEmpreintePubliee(this.repo.manager, slug);
  }

  async publier(contenu: ContenuAPublier, empreinte: string): Promise<number> {
    return this.repo.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        contenu.slug,
      ]);
      const [{ derniere }]: LigneVersion[] = await manager.query(
        `SELECT MAX("version") AS "derniere" FROM "formation_course_contents" WHERE "slug" = $1`,
        [contenu.slug],
      );
      if ((await lireEmpreintePubliee(manager, contenu.slug)) === empreinte) {
        return await this.versionPubliee(manager, contenu.slug);
      }
      const version = (derniere ?? 0) + 1;
      const cours = await manager.save(
        manager.create(FormationCourseContentEntity, {
          slug: contenu.slug,
          version,
          titre: contenu.titre,
          niveau: contenu.niveau,
          dureeMinutes: contenu.dureeMinutes,
          concepts: contenu.concepts,
          remediations: contenu.remediations ?? {},
          medias: contenu.medias ?? [],
          empreinte,
        }),
      );
      await manager.save(
        contenu.ecrans.map((ecran, position) =>
          manager.create(FormationScreenContentEntity, {
            courseId: cours.id,
            position,
            screenId: ecran.screenId,
            titre: ecran.titre ?? null,
            diffusion: ecran.diffusion ?? DIFFUSION_PAR_DEFAUT,
            brique: ecran.brique,
            dureeMinutes: ecran.dureeMinutes,
            concepts: ecran.concepts,
            notes: ecran.notes,
            proprietes: ecran.proprietes,
          }),
        ),
      );
      await manager.upsert(
        FormationCoursePublicationEntity,
        {
          slug: contenu.slug,
          versionPubliee: version,
          publieeLe: new Date(),
          publieePar: null,
        },
        ['slug'],
      );
      return version;
    });
  }

  private async versionPubliee(
    manager: EntityManager,
    slug: string,
  ): Promise<number> {
    const publication = await manager.findOneByOrFail(
      FormationCoursePublicationEntity,
      { slug },
    );
    return publication.versionPubliee;
  }
}
