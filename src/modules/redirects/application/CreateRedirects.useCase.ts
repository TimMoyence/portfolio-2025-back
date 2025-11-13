import { Inject } from '@nestjs/common/decorators/core/inject.decorator';
import type { IRedirectsRepository } from '../domain/IRedirects.repository';
import { REDIRECTS_REPOSITORY } from '../domain/token';

export class CreateRedirectsUseCase {
  constructor(
    @Inject(REDIRECTS_REPOSITORY)
    private repo: IRedirectsRepository,
  ) {}
  async execute(data: any) {
    return this.repo.create(data);
  }
}
