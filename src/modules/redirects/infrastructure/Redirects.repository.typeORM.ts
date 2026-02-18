import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm';
import { IRedirectsRepository } from '../domain/IRedirects.repository';
import { Redirects } from '../domain/Redirects';
import { RedirectsEntity } from './entities/Redirects.entity';
@Injectable()
export class RedirectsRepositoryTypeORM implements IRedirectsRepository {
  constructor(
    @InjectRepository(RedirectsEntity)
    private readonly repo: Repository<RedirectsEntity>,
  ) {}
  async findAll(): Promise<Redirects[]> {
    return this.repo.find();
  }
  async create(data: Redirects): Promise<Redirects> {
    return this.repo.save(data);
  }
}
