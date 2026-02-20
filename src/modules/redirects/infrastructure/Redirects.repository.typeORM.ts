import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginatedResult,
  createPaginatedResult,
} from '../../../common/domain/pagination.types';
import { RedirectListQuery, RedirectSortBy } from '../domain/RedirectList.query';
import { IRedirectsRepository } from '../domain/IRedirects.repository';
import { Redirects } from '../domain/Redirects';
import { RedirectsEntity } from './entities/Redirects.entity';

@Injectable()
export class RedirectsRepositoryTypeORM implements IRedirectsRepository {
  constructor(
    @InjectRepository(RedirectsEntity)
    private readonly repo: Repository<RedirectsEntity>,
  ) {}

  async findAll(query: RedirectListQuery): Promise<PaginatedResult<Redirects>> {
    const qb = this.repo.createQueryBuilder('redirect');
    if (query.enabled !== undefined) {
      qb.andWhere('redirect.enabled = :enabled', { enabled: query.enabled });
    }

    const [entities, total] = await qb
      .orderBy(this.resolveSortColumn(query.sortBy), query.order)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return createPaginatedResult(
      entities as unknown as Redirects[],
      total,
      query.page,
      query.limit,
    );
  }

  async create(data: Redirects): Promise<Redirects> {
    const saved = await this.repo.save(data as unknown as Partial<RedirectsEntity>);
    return saved as unknown as Redirects;
  }

  private resolveSortColumn(sortBy: RedirectSortBy): string {
    switch (sortBy) {
      case 'slug':
        return 'redirect.slug';
      case 'clicks':
        return 'redirect.clicks';
      case 'createdAt':
      default:
        return 'redirect.createdAt';
    }
  }
}
