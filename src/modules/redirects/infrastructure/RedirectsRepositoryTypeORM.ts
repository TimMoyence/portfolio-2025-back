import { Repository } from 'typeorm';
import { IRedirectsRepository } from '../domain/IRedirectsRepository';
import { RedirectsEntity } from './entities/Redirects.entity';

export class RedirectsRepositoryTypeORM implements IRedirectsRepository {
  constructor(private readonly repo: Repository<RedirectsEntity>) {}
  async findAll() {
    return this.repo.find();
  }
  async create(data: any) {
    return this.repo.save(data);
  }
}
