import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Cours } from '../domain/contrats/cours';
import { creerCacheLRU } from '../domain/cours/CacheLRU';
import { lireCoursStocke } from '../domain/cours/CoursStocke';
import type {
  CoursPublie,
  ICatalogueCours,
} from '../domain/cours/ICatalogueCours.port';
import { FormationCourseContentEntity } from './entities/FormationCourseContent.entity';
import { FormationCoursePublicationEntity } from './entities/FormationCoursePublication.entity';

const TAILLE_CACHE_DES_COURS = 8;

function cleDuCours(slug: string, version: number): string {
  return `${slug}@${String(version)}`;
}

@Injectable()
export class CoursCatalogueRepositoryTypeORM implements ICatalogueCours {
  private readonly coursLus = creerCacheLRU<Cours>(TAILLE_CACHE_DES_COURS);

  constructor(
    @InjectRepository(FormationCourseContentEntity)
    private readonly repo: Repository<FormationCourseContentEntity>,
    @InjectRepository(FormationCoursePublicationEntity)
    private readonly publications: Repository<FormationCoursePublicationEntity>,
  ) {}

  async trouver(slug: string, version?: number): Promise<Cours | null> {
    if (version !== undefined) {
      const memorise = this.coursLus.lire(cleDuCours(slug, version));
      if (memorise !== undefined) {
        return memorise;
      }
    }
    const entity = await this.findEntity(slug, version);
    return entity === null ? null : this.toDomain(entity);
  }

  async trouverCourant(slug: string): Promise<CoursPublie | null> {
    const publication = await this.publications.findOne({ where: { slug } });
    if (publication === null) {
      return null;
    }
    const memorise = this.coursLus.lire(
      cleDuCours(slug, publication.versionPubliee),
    );
    if (memorise !== undefined) {
      return {
        cours: memorise,
        version: publication.versionPubliee,
        publieLe: publication.publieeLe,
      };
    }
    const entity = await this.findEntity(slug, publication.versionPubliee);
    if (entity === null) {
      return null;
    }
    return {
      cours: this.toDomain(entity),
      version: entity.version,
      publieLe: publication.publieeLe,
    };
  }

  private async findEntity(
    slug: string,
    version?: number,
  ): Promise<FormationCourseContentEntity | null> {
    const query = this.repo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.ecrans', 'screen')
      .where('course.slug = :slug', { slug })
      .orderBy('course.version', 'DESC')
      .addOrderBy('screen.position', 'ASC');
    if (version !== undefined) {
      query.andWhere('course.version = :version', { version });
    }
    return query.getOne();
  }

  private toDomain(entity: FormationCourseContentEntity): Cours {
    const cours = lireCoursStocke({
      slug: entity.slug,
      version: entity.version,
      titre: entity.titre,
      niveau: entity.niveau,
      dureeMinutes: entity.dureeMinutes,
      concepts: entity.concepts,
      remediations: entity.remediations,
      medias: entity.medias,
      ecrans: entity.ecrans.map((screen) => ({
        screenId: screen.screenId,
        brique: screen.brique,
        titre: screen.titre,
        diffusion: screen.diffusion,
        dureeMinutes: screen.dureeMinutes,
        concepts: screen.concepts,
        notes: screen.notes,
        proprietes: screen.proprietes,
      })),
    });
    this.coursLus.ecrire(cleDuCours(entity.slug, entity.version), cours);
    return cours;
  }
}
