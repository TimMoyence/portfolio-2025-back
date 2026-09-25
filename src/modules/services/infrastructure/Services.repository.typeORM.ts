import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepotPagine } from '../../../common/infrastructure/typeorm/page-de-requete';
import { IServicesRepository } from '../domain/IServices.repository';
import { ServiceListQuery } from '../domain/ServiceList.query';
import { Services } from '../domain/Services';
import { ServicesEntity } from './entities/Services.entity';

@Injectable()
export class ServicesRepositoryTypeORM
  extends DepotPagine<ServicesEntity, Services, ServiceListQuery>
  implements IServicesRepository
{
  constructor(
    @InjectRepository(ServicesEntity)
    repo: Repository<ServicesEntity>,
  ) {
    super(repo, {
      alias: 'service',
      colonnes: ['order', 'slug', 'name', 'createdAt'],
      parDefaut: 'order',
      filtres: (query) => ({ status: query.status }),
    });
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

  protected toDomain(entity: ServicesEntity): Services {
    const service = new Services();
    service.id = entity.id;
    service.slug = entity.slug;
    service.name = entity.name;
    service.icon = entity.icon;
    service.status = entity.status;
    service.order = entity.order;
    return service;
  }
}
