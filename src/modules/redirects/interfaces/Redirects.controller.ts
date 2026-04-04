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
import { CreateRedirectsUseCase } from '../application/CreateRedirects.useCase';
import { ListRedirectsUseCase } from '../application/ListRedirects.useCase';
import { CreateRedirectCommand } from '../application/dto/CreateRedirect.command';
import { RedirectListQueryDto } from './dto/redirect-list.query.dto';
import { RedirectListResponseDto } from './dto/redirect-list.response.dto';
import { RedirectRequestDto } from './dto/redirect.request.dto';
import { RedirectResponseDto } from './dto/redirect.response.dto';

@Controller('redirects')
export class RedirectsController {
  constructor(
    private readonly listUseCase: ListRedirectsUseCase,
    private readonly createUseCase: CreateRedirectsUseCase,
  ) {}

  @Public()
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
    enum: ['slug', 'clicks', 'createdAt'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'enabled',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiOkResponse({ type: RedirectListResponseDto })
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

    return {
      items: result.items.map((redirect) =>
        RedirectResponseDto.fromDomain(redirect),
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
  @ApiCreatedResponse({ type: RedirectResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
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
