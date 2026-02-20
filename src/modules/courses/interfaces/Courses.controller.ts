import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateCoursesUseCase } from '../application/CreateCourses.useCase';
import { ListCoursesUseCase } from '../application/ListCourses.useCase';
import { CreateCourseCommand } from '../application/dto/CreateCourse.command';
import { CourseListQueryDto } from './dto/course-list.query.dto';
import { CourseListResponseDto } from './dto/course-list.response.dto';
import { CourseRequestDto } from './dto/course.request.dto';
import { CourseResponseDto } from './dto/course.response.dto';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly listUseCase: ListCoursesUseCase,
    private readonly createUseCase: CreateCoursesUseCase,
  ) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, example: 1, type: Number })
  @ApiQuery({ name: 'limit', required: false, example: 20, type: Number })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['slug', 'title', 'createdAt'],
    example: 'createdAt',
  })
  @ApiOkResponse({ type: CourseListResponseDto })
  async findAll(@Query() query: CourseListQueryDto): Promise<CourseListResponseDto> {
    const result = await this.listUseCase.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      order: query.order,
    });

    return {
      items: result.items.map((course) => CourseResponseDto.fromDomain(course)),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Post()
  @ApiCreatedResponse({ type: CourseResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
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
