import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../../../common/domain/pagination.types';
import { pageDeRequete } from '../../../common/infrastructure/typeorm/page-de-requete';
import { IServicesRepository } from '../domain/IServices.repository';
import { ServiceListQuery, ServiceSortBy } from '../domain/ServiceList.query';
import { Services } from '../domain/Services';
import { ServicesEntity } from './entities/Services.entity';

@Injectable()
export class ServicesRepositoryTypeORM implements IServicesRepository {
  constructor(
    @InjectRepository(ServicesEntity)
    private readonly repo: Repository<ServicesEntity>,
  ) {}

  async findAll(query: ServiceListQuery): Promise<PaginatedResult<Services>> {
    return pageDeRequete(
      this.repo.createQueryBuilder('service'),
      {
        ...query,
        colonneDeTri: this.resolveSortColumn(query.sortBy),
        filtres: { status: query.status },
      },
      (entity) => this.toDomain(entity),
    );
  }

  async create(data: Services): Promise<Services> {
    const saved = await this.repo.save(
      this.repo.create({
        slug: data.slug,
        name: data.name,
        icon: data.icon,
        status: data.status,
        order: data.order,
      }),
    );
    return this.toDomain(saved);
  }

  private toDomain(entity: ServicesEntity): Services {
    const service = new Services();
    service.id = entity.id;
    service.slug = entity.slug;
    service.name = entity.name;
    service.icon = entity.icon;
    service.status = entity.status;
    service.order = entity.order;
    return service;
  }

  private resolveSortColumn(sortBy: ServiceSortBy): string {
    switch (sortBy) {
      case 'slug':
        return 'service.slug';
      case 'name':
        return 'service.name';
      case 'createdAt':
        return 'service.createdAt';
      case 'order':
      default:
        return 'service.order';
    }
  }
}
