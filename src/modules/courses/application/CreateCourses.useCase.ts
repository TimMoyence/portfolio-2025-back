import { Inject } from '@nestjs/common/decorators/core/inject.decorator';
import type { ICoursesRepository } from '../domain/ICourses.repository';
import { COURSES_REPOSITORY } from '../domain/token';

export class CreateCoursesUseCase {
  constructor(
    @Inject(COURSES_REPOSITORY)
    private readonly repo: ICoursesRepository,
  ) {}
  async execute(data: any) {
    return this.repo.create(data);
  }
}
