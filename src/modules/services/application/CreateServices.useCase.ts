import { Inject, Injectable } from '@nestjs/common';
import type { IServicesRepository } from '../domain/IServices.repository';
import { Services } from '../domain/Services';
import { SERVICES_REPOSITORY } from '../domain/token';
import { CreateServiceCommand } from './dto/CreateService.command';
import { ServiceMapper } from './mappers/Service.mapper';

/** Orchestre la creation d'un service a partir d'une commande applicative. */
@Injectable()
export class CreateServicesUseCase {
  constructor(
    @Inject(SERVICES_REPOSITORY)
    private repo: IServicesRepository,
  ) {}

  async execute(data: CreateServiceCommand): Promise<Services> {
    const service = ServiceMapper.fromCreateCommand(data);
    return this.repo.create(service);
  }
}
