import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResult } from '../../../common/domain/pagination.types';
import type { IServicesRepository } from '../domain/IServices.repository';
import type { ServiceListQuery } from '../domain/ServiceList.query';
import type { Services } from '../domain/Services';
import { SERVICES_REPOSITORY } from '../domain/token';

@Injectable()
export class ListServicesUseCase {
  constructor(
    @Inject(SERVICES_REPOSITORY)
    private readonly repo: IServicesRepository,
  ) {}

  execute(query: ServiceListQuery): Promise<PaginatedResult<Services>> {
    return this.repo.findAll(query);
  }
}
