import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm';
import { IProjectsRepository } from '../domain/IProjects.repository';
import { ProjectsEntity } from './entities/Projects.entity';
@Injectable()
export class ProjectsRepositoryTypeORM implements IProjectsRepository {
  constructor(
    @InjectRepository(ProjectsEntity)
    private readonly repo: Repository<ProjectsEntity>,
  ) {}
  async findAll() {
    return this.repo.find();
  }
  async create(data: any) {
    return this.repo.save(data);
  }
}
