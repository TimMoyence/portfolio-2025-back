import { PaginatedResult } from '../../../common/domain/pagination.types';
import { RedirectListQuery } from './RedirectList.query';
import { Redirects } from './Redirects';

export interface IRedirectsRepository {
  findAll(query: RedirectListQuery): Promise<PaginatedResult<Redirects>>;
  create(data: Redirects): Promise<Redirects>;
}
