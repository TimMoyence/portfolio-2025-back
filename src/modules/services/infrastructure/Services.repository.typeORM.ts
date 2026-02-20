import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginatedResult,
  createPaginatedResult,
} from '../../../common/domain/pagination.types';
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
      entities as unknown as Services[],
      total,
      query.page,
      query.limit,
    );
  }

  async create(data: Services): Promise<Services> {
    const saved = await this.repo.save(data as unknown as Partial<ServicesEntity>);
    return saved as unknown as Services;
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
