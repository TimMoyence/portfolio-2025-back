import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResult } from '../../../common/domain/pagination.types';
import type { IRedirectsRepository } from '../domain/IRedirects.repository';
import type { RedirectListQuery } from '../domain/RedirectList.query';
import type { Redirects } from '../domain/Redirects';
import { REDIRECTS_REPOSITORY } from '../domain/token';

@Injectable()
export class ListRedirectsUseCase {
  constructor(
    @Inject(REDIRECTS_REPOSITORY)
    private readonly repo: IRedirectsRepository,
  ) {}

  execute(query: RedirectListQuery): Promise<PaginatedResult<Redirects>> {
    return this.repo.findAll(query);
  }
}
