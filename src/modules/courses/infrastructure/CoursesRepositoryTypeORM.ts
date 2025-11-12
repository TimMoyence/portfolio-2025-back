import { Repository } from 'typeorm';
import { ICoursesRepository } from '../domain/ICoursesRepository';
import { CoursesEntity } from './entities/Courses.entity';

export class CoursesRepositoryTypeORM implements ICoursesRepository {
  constructor(private readonly repo: Repository<CoursesEntity>) {}
  async findAll() {
    return this.repo.find();
  }
  async create(data: any) {
    return this.repo.save(data);
  }
}
