import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../../../common/domain/pagination.types';
import { pageDeRequete } from '../../../common/infrastructure/typeorm/page-de-requete';
import {
  RedirectListQuery,
  RedirectSortBy,
} from '../domain/RedirectList.query';
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
    return pageDeRequete(
      this.repo.createQueryBuilder('redirect'),
      {
        ...query,
        colonneDeTri: this.resolveSortColumn(query.sortBy),
        filtres: { enabled: query.enabled },
      },
      (entity) => this.toDomain(entity),
    );
  }

  async create(data: Redirects): Promise<Redirects> {
    const saved = await this.repo.save(
      this.repo.create({
        slug: data.slug,
        targetUrl: data.targetUrl,
        enabled: data.enabled,
        clicks: data.clicks,
      }),
    );
    return this.toDomain(saved);
  }

  private toDomain(entity: RedirectsEntity): Redirects {
    const redirect = new Redirects();
    redirect.id = entity.id;
    redirect.slug = entity.slug;
    redirect.targetUrl = entity.targetUrl;
    redirect.enabled = entity.enabled;
    redirect.clicks = entity.clicks;
    return redirect;
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
