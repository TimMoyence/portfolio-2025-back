import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { CreateProjectsUseCase } from '../application/CreateProjects.useCase';
import { ListProjectsUseCase } from '../application/ListProjects.useCase';
import { CreateProjectCommand } from '../application/dto/CreateProject.command';
import { ProjectListQueryDto } from './dto/project-list.query.dto';
import { ProjectListResponseDto } from './dto/project-list.response.dto';
import { ProjectRequestDto } from './dto/project.request.dto';
import { ProjectResponseDto } from './dto/project.response.dto';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly listUseCase: ListProjectsUseCase,
    private readonly createUseCase: CreateProjectsUseCase,
  ) {}

  @Public()
  @Get()
  @ApiQuery({ name: 'page', required: false, example: 1, type: Number })
  @ApiQuery({ name: 'limit', required: false, example: 20, type: Number })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['order', 'slug', 'type', 'createdAt'],
    example: 'order',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['CLIENT', 'SIDE'],
    example: 'SIDE',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    example: 'PUBLISHED',
  })
  @ApiOkResponse({ type: ProjectListResponseDto })
  async findAll(
    @Query() query: ProjectListQueryDto,
  ): Promise<ProjectListResponseDto> {
    const result = await this.listUseCase.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      type: query.type,
      status: query.status,
      order: query.order,
    });

    return {
      items: result.items.map((project) =>
        ProjectResponseDto.fromDomain(project),
      ),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ProjectResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(@Body() dto: ProjectRequestDto): Promise<ProjectResponseDto> {
    const command: CreateProjectCommand = {
      slug: dto.slug,
      type: dto.type,
      repoUrl: dto.repoUrl,
      liveUrl: dto.liveUrl,
      coverImage: dto.coverImage,
      gallery: dto.gallery,
      stack: dto.stack,
      status: dto.status,
      order: dto.order,
    };

    const project = await this.createUseCase.execute(command);
    return ProjectResponseDto.fromDomain(project);
  }
}
