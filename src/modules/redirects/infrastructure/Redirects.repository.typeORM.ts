import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepotPagine } from '../../../common/infrastructure/typeorm/page-de-requete';
import { RedirectListQuery } from '../domain/RedirectList.query';
import { IRedirectsRepository } from '../domain/IRedirects.repository';
import { Redirects } from '../domain/Redirects';
import { RedirectsEntity } from './entities/Redirects.entity';

@Injectable()
export class RedirectsRepositoryTypeORM
  extends DepotPagine<RedirectsEntity, Redirects, RedirectListQuery>
  implements IRedirectsRepository
{
  constructor(
    @InjectRepository(RedirectsEntity)
    repo: Repository<RedirectsEntity>,
  ) {
    super(repo, {
      alias: 'redirect',
      colonnes: ['slug', 'clicks', 'createdAt'],
      parDefaut: 'createdAt',
      filtres: (query) => ({ enabled: query.enabled }),
    });
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

  protected toDomain(entity: RedirectsEntity): Redirects {
    const redirect = new Redirects();
    redirect.id = entity.id;
    redirect.slug = entity.slug;
    redirect.targetUrl = entity.targetUrl;
    redirect.enabled = entity.enabled;
    redirect.clicks = entity.clicks;
    return redirect;
  }
}
