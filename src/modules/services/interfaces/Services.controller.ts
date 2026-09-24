import { Body, Controller, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreationAdmin,
  FILTRE_STATUT_DE_PUBLICATION,
  ListePubliquePaginee,
  reponsePaginee,
} from '../../../common/interfaces/http/routes-de-catalogue';
import { CreateServicesUseCase } from '../application/CreateServices.useCase';
import { ListServicesUseCase } from '../application/ListServices.useCase';
import { CreateServiceCommand } from '../application/dto/CreateService.command';
import { ServiceListResponseDto } from './dto/service-list.response.dto';
import { ServiceListQueryDto } from './dto/service-list.query.dto';
import { ServiceRequestDto } from './dto/service.request.dto';
import { ServiceResponseDto } from './dto/service.response.dto';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly listUseCase: ListServicesUseCase,
    private readonly createUseCase: CreateServicesUseCase,
  ) {}

  @ListePubliquePaginee({
    resume: 'Lister les services (acces public, pagine)',
    reponse: ServiceListResponseDto,
    ordreParDefaut: 'ASC',
    triables: ['order', 'slug', 'name', 'createdAt'],
    triParDefaut: 'order',
    filtres: [FILTRE_STATUT_DE_PUBLICATION],
  })
  async findAll(
    @Query() query: ServiceListQueryDto,
  ): Promise<ServiceListResponseDto> {
    const result = await this.listUseCase.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      status: query.status,
      order: query.order,
    });
    return reponsePaginee(result, (service) =>
      ServiceResponseDto.fromDomain(service),
    );
  }

  @CreationAdmin('Creer un service (admin)', ServiceResponseDto)
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
