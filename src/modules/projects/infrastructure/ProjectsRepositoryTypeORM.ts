import { Repository } from 'typeorm';
import { IProjectsRepository } from '../domain/IProjectsRepository';
import { ProjectsEntity } from './entities/Projects.entity';

export class ProjectsRepositoryTypeORM implements IProjectsRepository {
  constructor(private readonly repo: Repository<ProjectsEntity>) {}
  async findAll() {
    return this.repo.find();
  }
  async create(data: any) {
    return this.repo.save(data);
  }
}
