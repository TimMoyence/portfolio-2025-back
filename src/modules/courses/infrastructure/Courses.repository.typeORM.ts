import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../../../common/domain/pagination.types';
import { pageDeRequete } from '../../../common/infrastructure/typeorm/page-de-requete';
import { CourseListQuery, CourseSortBy } from '../domain/CourseList.query';
import { Courses } from '../domain/Courses';
import { ICoursesRepository } from '../domain/ICourses.repository';
import { CoursesEntity } from './entities/Courses.entity';

@Injectable()
export class CoursesRepositoryTypeORM implements ICoursesRepository {
  constructor(
    @InjectRepository(CoursesEntity)
    private readonly repo: Repository<CoursesEntity>,
  ) {}

  async findAll(query: CourseListQuery): Promise<PaginatedResult<Courses>> {
    return pageDeRequete(
      this.repo.createQueryBuilder('course'),
      { ...query, colonneDeTri: this.resolveSortColumn(query.sortBy) },
      (entity) => this.toDomain(entity),
    );
  }

  async create(data: Courses): Promise<Courses> {
    const saved = await this.repo.save(
      this.repo.create({
        slug: data.slug,
        title: data.title,
        summary: data.summary,
        coverImage: data.coverImage,
      }),
    );
    return this.toDomain(saved);
  }

  private toDomain(entity: CoursesEntity): Courses {
    const course = new Courses();
    course.id = entity.id;
    course.slug = entity.slug;
    course.title = entity.title;
    course.summary = entity.summary;
    course.coverImage = entity.coverImage;
    return course;
  }

  private resolveSortColumn(sortBy: CourseSortBy): string {
    switch (sortBy) {
      case 'slug':
        return 'course.slug';
      case 'title':
        return 'course.title';
      case 'createdAt':
      default:
        return 'course.createdAt';
    }
  }
}
