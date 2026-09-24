import { Body, Controller, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreationAdmin,
  FILTRE_STATUT_DE_PUBLICATION,
  ListePubliquePaginee,
  reponsePaginee,
} from '../../../common/interfaces/http/routes-de-catalogue';
import { CreateProjectsUseCase } from '../application/CreateProjects.useCase';
import { ListProjectsUseCase } from '../application/ListProjects.useCase';
import { CreateProjectCommand } from '../application/dto/CreateProject.command';
import { ProjectListQueryDto } from './dto/project-list.query.dto';
import { ProjectListResponseDto } from './dto/project-list.response.dto';
import { ProjectRequestDto } from './dto/project.request.dto';
import { ProjectResponseDto } from './dto/project.response.dto';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly listUseCase: ListProjectsUseCase,
    private readonly createUseCase: CreateProjectsUseCase,
  ) {}

  @ListePubliquePaginee({
    resume: 'Lister les projets (acces public, pagine)',
    reponse: ProjectListResponseDto,
    ordreParDefaut: 'ASC',
    triables: ['order', 'slug', 'type', 'createdAt'],
    triParDefaut: 'order',
    filtres: [
      {
        name: 'type',
        required: false,
        enum: ['CLIENT', 'SIDE'],
        example: 'SIDE',
      },
      FILTRE_STATUT_DE_PUBLICATION,
    ],
  })
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
    return reponsePaginee(result, (project) =>
      ProjectResponseDto.fromDomain(project),
    );
  }

  @CreationAdmin('Creer un projet (admin)', ProjectResponseDto)
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
