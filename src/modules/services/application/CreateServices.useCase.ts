import { Inject } from '@nestjs/common/decorators/core/inject.decorator';
import type { IServicesRepository } from '../domain/IServices.repository';
import { SERVICES_REPOSITORY } from '../domain/token';

export class CreateServicesUseCase {
  constructor(
    @Inject(SERVICES_REPOSITORY)
    private repo: IServicesRepository,
  ) {}
  async execute(data: any) {
    return this.repo.create(data);
  }
}
