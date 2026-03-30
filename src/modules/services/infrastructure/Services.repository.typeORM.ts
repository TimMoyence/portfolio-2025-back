import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginatedResult,
  createPaginatedResult,
} from '../../../common/domain/pagination.types';
import { IServicesRepository } from '../domain/IServices.repository';
import { ServiceListQuery, ServiceSortBy } from '../domain/ServiceList.query';
import { ServiceStatus, Services } from '../domain/Services';
import { ServicesEntity } from './entities/Services.entity';
import { PublishStatus } from '../../projects/infrastructure/enums/PublishStatus.enum';

@Injectable()
export class ServicesRepositoryTypeORM implements IServicesRepository {
  constructor(
    @InjectRepository(ServicesEntity)
    private readonly repo: Repository<ServicesEntity>,
  ) {}

  async findAll(query: ServiceListQuery): Promise<PaginatedResult<Services>> {
    const qb = this.repo.createQueryBuilder('service');
    if (query.status) {
      qb.andWhere('service.status = :status', { status: query.status });
    }

    const [entities, total] = await qb
      .orderBy(this.resolveSortColumn(query.sortBy), query.order)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return createPaginatedResult(
      entities.map((e) => this.toDomain(e)),
      total,
      query.page,
      query.limit,
    );
  }

  async create(data: Services): Promise<Services> {
    const entity = this.repo.create({
      slug: data.slug,
      name: data.name,
      icon: data.icon,
      status: data.status as PublishStatus,
      order: data.order,
    });
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: ServicesEntity): Services {
    const service = new Services();
    service.id = entity.id;
    service.slug = entity.slug;
    service.name = entity.name;
    service.icon = entity.icon;
    service.status = entity.status as ServiceStatus;
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
