import { Repository } from 'typeorm';
import { Users } from '../domain/Users';
import { IUsersRepository } from '../domain/IUsersRepository';
import { UsersEntity } from './entities/Users.entity';

export class UsersRepositoryTypeORM implements IUsersRepository {
  constructor(private readonly repo: Repository<UsersEntity>) {}
  async findAll() {
    return this.repo.find();
  }
  async create(data: any) {
    return this.repo.save(data);
  }
}
