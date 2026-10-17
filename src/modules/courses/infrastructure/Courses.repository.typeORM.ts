import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepotPagine } from '../../../common/infrastructure/typeorm/page-de-requete';
import { CourseListQuery } from '../domain/CourseList.query';
import { Courses } from '../domain/Courses';
import { ICoursesRepository } from '../domain/ICourses.repository';
import { CoursesEntity } from './entities/Courses.entity';

@Injectable()
export class CoursesRepositoryTypeORM
  extends DepotPagine<CoursesEntity, Courses, CourseListQuery>
  implements ICoursesRepository
{
  constructor(
    @InjectRepository(CoursesEntity)
    repo: Repository<CoursesEntity>,
  ) {
    super(repo, {
      alias: 'course',
      colonnes: ['slug', 'title', 'createdAt'],
      parDefaut: 'createdAt',
    });
  }

  create(data: Courses): Promise<Courses> {
    return this.enregistrer({
      slug: data.slug,
      title: data.title,
      summary: data.summary,
      coverImage: data.coverImage,
    });
  }

  protected toDomain(entity: CoursesEntity): Courses {
    const course = new Courses();
    course.id = entity.id;
    course.slug = entity.slug;
    course.title = entity.title;
    course.summary = entity.summary;
    course.coverImage = entity.coverImage;
    return course;
  }
}
