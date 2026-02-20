import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateServicesUseCase } from '../application/CreateServices.useCase';
import { ListServicesUseCase } from '../application/ListServices.useCase';
import { CreateServiceCommand } from '../application/dto/CreateService.command';
import { ServiceListResponseDto } from './dto/service-list.response.dto';
import { ServiceListQueryDto } from './dto/service-list.query.dto';
import { ServiceRequestDto } from './dto/service.request.dto';
import { ServiceResponseDto } from './dto/service.response.dto';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly listUseCase: ListServicesUseCase,
    private readonly createUseCase: CreateServicesUseCase,
  ) {}

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
    enum: ['order', 'slug', 'name', 'createdAt'],
    example: 'order',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    example: 'PUBLISHED',
  })
  @ApiOkResponse({ type: ServiceListResponseDto })
  async findAll(@Query() query: ServiceListQueryDto): Promise<ServiceListResponseDto> {
    const result = await this.listUseCase.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      status: query.status,
      order: query.order,
    });

    return {
      items: result.items.map((service) => ServiceResponseDto.fromDomain(service)),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Post()
  @ApiCreatedResponse({ type: ServiceResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(@Body() dto: ServiceRequestDto): Promise<ServiceResponseDto> {
    const command: CreateServiceCommand = {
      slug: dto.slug,
      name: dto.name,
      icon: dto.icon,
      status: dto.status,
      order: dto.order,
    };

    const service = await this.createUseCase.execute(command);
    return ServiceResponseDto.fromDomain(service);
  }
}
