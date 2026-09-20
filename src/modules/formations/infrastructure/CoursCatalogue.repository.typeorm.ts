import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Cours } from '../domain/contrats/cours';
import { lireCoursStocke } from '../domain/cours/CoursStocke';
import { CoursInconnuError } from '../domain/errors/FormationErrors';
import type {
  CoursPublie,
  ICatalogueCours,
} from '../domain/cours/ICatalogueCours.port';
import { FormationCourseContentEntity } from './entities/FormationCourseContent.entity';
import { FormationCoursePublicationEntity } from './entities/FormationCoursePublication.entity';

@Injectable()
export class CoursCatalogueRepositoryTypeORM implements ICatalogueCours {
  constructor(
    @InjectRepository(FormationCourseContentEntity)
    private readonly repo: Repository<FormationCourseContentEntity>,
    @InjectRepository(FormationCoursePublicationEntity)
    private readonly publications: Repository<FormationCoursePublicationEntity>,
  ) {}

  async trouver(slug: string, version?: number): Promise<Cours | null> {
    const entity = await this.findEntity(slug, version);
    return entity === null ? null : this.toDomain(entity);
  }

  async trouverCourant(slug: string): Promise<CoursPublie | null> {
    const publication = await this.publications.findOne({ where: { slug } });
    const entity = await this.findEntity(slug, publication?.versionPubliee);
    if (entity === null) {
      return null;
    }
    return {
      cours: this.toDomain(entity),
      version: entity.version,
      publieLe: publication?.publieeLe ?? entity.createdAt,
    };
  }

  async publier(input: {
    readonly slug: string;
    readonly version: number;
    readonly parQui: string | null;
  }): Promise<CoursPublie> {
    const entity = await this.findEntity(input.slug, input.version);
    if (entity === null) {
      throw new CoursInconnuError(`${input.slug}@${String(input.version)}`);
    }
    const cours = this.toDomain(entity);
    await this.publications.upsert(
      {
        slug: input.slug,
        versionPubliee: input.version,
        publieeLe: new Date(),
        publieePar: input.parQui,
      },
      ['slug'],
    );
    const publication = await this.publications.findOne({
      where: { slug: input.slug },
    });
    return {
      cours,
      version: input.version,
      publieLe: publication?.publieeLe ?? new Date(),
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
    return lireCoursStocke({
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
  }
}
