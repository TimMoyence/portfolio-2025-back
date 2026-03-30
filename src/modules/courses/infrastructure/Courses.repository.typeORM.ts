import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginatedResult,
  createPaginatedResult,
} from '../../../common/domain/pagination.types';
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
    const [entities, total] = await this.repo
      .createQueryBuilder('course')
      .orderBy(this.resolveSortColumn(query.sortBy), query.order)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return createPaginatedResult(
      entities.map((e) => this.toDomain(e)),
      total,
      query.page,
      query.limit,
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
