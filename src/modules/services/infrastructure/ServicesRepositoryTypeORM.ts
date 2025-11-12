import { Repository } from 'typeorm';
import { IServicesRepository } from '../domain/IServicesRepository';
import { ServicesEntity } from './entities/Services.entity';

export class ServicesRepositoryTypeORM implements IServicesRepository {
  constructor(private readonly repo: Repository<ServicesEntity>) {}
  async findAll() {
    return this.repo.find();
  }
  async create(data: any) {
    return this.repo.save(data);
  }
}
