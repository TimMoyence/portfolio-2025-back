import { Body, Controller, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreationAdmin,
  ListePubliquePaginee,
  reponsePaginee,
} from '../../../common/interfaces/http/routes-de-catalogue';
import { CreateRedirectsUseCase } from '../application/CreateRedirects.useCase';
import { ListRedirectsUseCase } from '../application/ListRedirects.useCase';
import { CreateRedirectCommand } from '../application/dto/CreateRedirect.command';
import { RedirectListQueryDto } from './dto/redirect-list.query.dto';
import { RedirectListResponseDto } from './dto/redirect-list.response.dto';
import { RedirectRequestDto } from './dto/redirect.request.dto';
import { RedirectResponseDto } from './dto/redirect.response.dto';

@ApiTags('redirects')
@Controller('redirects')
export class RedirectsController {
  constructor(
    private readonly listUseCase: ListRedirectsUseCase,
    private readonly createUseCase: CreateRedirectsUseCase,
  ) {}

  @ListePubliquePaginee({
    resume: 'Lister les redirections (acces public, pagine)',
    reponse: RedirectListResponseDto,
    ordreParDefaut: 'DESC',
    triables: ['slug', 'clicks', 'createdAt'],
    triParDefaut: 'createdAt',
    filtres: [
      { name: 'enabled', required: false, type: Boolean, example: true },
    ],
  })
  async findAll(
    @Query() query: RedirectListQueryDto,
  ): Promise<RedirectListResponseDto> {
    const result = await this.listUseCase.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      enabled: query.enabled,
      order: query.order,
    });
    return reponsePaginee(result, (redirect) =>
      RedirectResponseDto.fromDomain(redirect),
    );
  }

  @CreationAdmin('Creer une redirection (admin)', RedirectResponseDto)
  async create(@Body() dto: RedirectRequestDto): Promise<RedirectResponseDto> {
    const command: CreateRedirectCommand = {
      slug: dto.slug,
      targetUrl: dto.targetUrl,
      enabled: dto.enabled,
      clicks: dto.clicks,
    };

    const redirect = await this.createUseCase.execute(command);
    return RedirectResponseDto.fromDomain(redirect);
  }
}
