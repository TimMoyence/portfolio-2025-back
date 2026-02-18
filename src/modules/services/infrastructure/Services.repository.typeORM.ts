import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm';
import { IServicesRepository } from '../domain/IServices.repository';
import { Services } from '../domain/Services';
import { ServicesEntity } from './entities/Services.entity';
@Injectable()
export class ServicesRepositoryTypeORM implements IServicesRepository {
  constructor(
    @InjectRepository(ServicesEntity)
    private readonly repo: Repository<ServicesEntity>,
  ) {}
  async findAll(): Promise<Services[]> {
    return this.repo.find();
  }
  async create(data: Services): Promise<Services> {
    return this.repo.save(data);
  }
}
