import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateCoursesUseCase } from './application/CreateCourses.useCase';
import { COURSES_REPOSITORY } from './domain/token';
import { CoursesRepositoryTypeORM } from './infrastructure/Courses.repository.typeORM';
import { CoursesEntity } from './infrastructure/entities/Courses.entity';
import { CourseResourceEntity } from './infrastructure/entities/CoursesRessources.entity';
import { CoursesTranslationEntity } from './infrastructure/entities/CoursesTranslation.entity';
import { CoursesController } from './interfaces/Courses.controller';

const COURSES_USE_CASES = [CreateCoursesUseCase];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CoursesEntity,
      CoursesTranslationEntity,
      CourseResourceEntity,
    ]),
  ],
  controllers: [CoursesController],
  providers: [
    ...COURSES_USE_CASES,
    {
      provide: COURSES_REPOSITORY,
      useClass: CoursesRepositoryTypeORM,
    },
  ],
  exports: [COURSES_REPOSITORY, ...COURSES_USE_CASES],
})
export class CoursesModule {}
