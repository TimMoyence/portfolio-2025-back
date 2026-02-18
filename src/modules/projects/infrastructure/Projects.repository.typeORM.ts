import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm';
import { IProjectsRepository } from '../domain/IProjects.repository';
import { Projects } from '../domain/Projects';
import { ProjectsEntity } from './entities/Projects.entity';
@Injectable()
export class ProjectsRepositoryTypeORM implements IProjectsRepository {
  constructor(
    @InjectRepository(ProjectsEntity)
    private readonly repo: Repository<ProjectsEntity>,
  ) {}
  async findAll(): Promise<Projects[]> {
    return this.repo.find();
  }
  async create(data: Projects): Promise<Projects> {
    return this.repo.save(data);
  }
}
