import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CoursesEntity } from "./infrastructure/entities/Courses.entity";
import { CoursesRepositoryTypeORM } from "./infrastructure/CoursesRepositoryTypeORM";
import { CoursesController } from "./interfaces/CoursesController";
import {COURSES_REPOSITORY} from "./domain/token";
import { CreateCoursesUseCase } from "./application/CreateCoursesUseCase";

const COURSES_USE_CASES = [CreateCoursesUseCase];

@Module({
  imports: [TypeOrmModule.forFeature([CoursesEntity])],
  controllers: [CoursesController],
  providers: [
    ...COURSES_USE_CASES,
    {
      provide: COURSES_REPOSITORY,
      useClass: CoursesRepositoryTypeORM,
    },
  ],
exports: [COURSES_REPOSITORY],
})
export class CoursesModule {}
