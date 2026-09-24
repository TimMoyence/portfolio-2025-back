import { Body, Controller, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreationAdmin,
  ListePubliquePaginee,
  reponsePaginee,
} from '../../../common/interfaces/http/routes-de-catalogue';
import { CreateCoursesUseCase } from '../application/CreateCourses.useCase';
import { ListCoursesUseCase } from '../application/ListCourses.useCase';
import { CreateCourseCommand } from '../application/dto/CreateCourse.command';
import { CourseListQueryDto } from './dto/course-list.query.dto';
import { CourseListResponseDto } from './dto/course-list.response.dto';
import { CourseRequestDto } from './dto/course.request.dto';
import { CourseResponseDto } from './dto/course.response.dto';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly listUseCase: ListCoursesUseCase,
    private readonly createUseCase: CreateCoursesUseCase,
  ) {}

  @ListePubliquePaginee({
    resume: 'Lister les formations (acces public, pagine)',
    reponse: CourseListResponseDto,
    ordreParDefaut: 'DESC',
    triables: ['slug', 'title', 'createdAt'],
    triParDefaut: 'createdAt',
  })
  async findAll(
    @Query() query: CourseListQueryDto,
  ): Promise<CourseListResponseDto> {
    const result = await this.listUseCase.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      order: query.order,
    });
    return reponsePaginee(result, (course) =>
      CourseResponseDto.fromDomain(course),
    );
  }

  @CreationAdmin('Creer une formation (admin)', CourseResponseDto)
  async create(@Body() dto: CourseRequestDto): Promise<CourseResponseDto> {
    const command: CreateCourseCommand = {
      slug: dto.slug,
      title: dto.title,
      summary: dto.summary,
      coverImage: dto.coverImage,
    };

    const course = await this.createUseCase.execute(command);
    return CourseResponseDto.fromDomain(course);
  }
}
