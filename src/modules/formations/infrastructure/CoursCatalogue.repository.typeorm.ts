import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Cours } from '../domain/contrats/cours';
import { lireCoursStocke } from '../domain/cours/CoursStocke';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { FormationCourseContentEntity } from './entities/FormationCourseContent.entity';

@Injectable()
export class CoursCatalogueRepositoryTypeORM implements ICatalogueCours {
  constructor(
    @InjectRepository(FormationCourseContentEntity)
    private readonly repo: Repository<FormationCourseContentEntity>,
  ) {}

  async trouver(slug: string, version?: number): Promise<Cours | null> {
    const entity = await this.findEntity(slug, version);
    return entity === null ? null : this.toDomain(entity);
  }

  async trouverCourant(
    slug: string,
  ): Promise<{ cours: Cours; version: number } | null> {
    const entity = await this.findEntity(slug);
    return entity === null
      ? null
      : { cours: this.toDomain(entity), version: entity.version };
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
