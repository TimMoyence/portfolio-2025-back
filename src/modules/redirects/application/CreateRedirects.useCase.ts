import { Inject } from '@nestjs/common/decorators/core/inject.decorator';
import type { IRedirectsRepository } from '../domain/IRedirects.repository';
import type { Redirects } from '../domain/Redirects';
import { REDIRECTS_REPOSITORY } from '../domain/token';

export class CreateRedirectsUseCase {
  constructor(
    @Inject(REDIRECTS_REPOSITORY)
    private repo: IRedirectsRepository,
  ) {}
  async execute(data: Redirects): Promise<Redirects> {
    return this.repo.create(data);
  }
}
