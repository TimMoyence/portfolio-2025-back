import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm';
import { Courses } from '../domain/Courses';
import { ICoursesRepository } from '../domain/ICourses.repository';
import { CoursesEntity } from './entities/Courses.entity';
@Injectable()
export class CoursesRepositoryTypeORM implements ICoursesRepository {
  constructor(
    @InjectRepository(CoursesEntity)
    private readonly repo: Repository<CoursesEntity>,
  ) {}
  async findAll(): Promise<Courses[]> {
    return this.repo.find();
  }
  async create(data: Courses): Promise<Courses> {
    return this.repo.save(data);
  }
}
