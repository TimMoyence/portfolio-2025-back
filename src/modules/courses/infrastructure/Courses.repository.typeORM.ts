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
      entities as unknown as Courses[],
      total,
      query.page,
      query.limit,
    );
  }

  async create(data: Courses): Promise<Courses> {
    const saved = await this.repo.save(data as unknown as Partial<CoursesEntity>);
    return saved as unknown as Courses;
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
