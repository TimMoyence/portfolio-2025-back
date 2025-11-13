import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm';
import { IUsersRepository } from '../domain/IUsers.repository';
import { UsersEntity } from './entities/Users.entity';
@Injectable()
export class UsersRepositoryTypeORM implements IUsersRepository {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly repo: Repository<UsersEntity>,
  ) {}
  async findAll(): Promise<UsersEntity[]> {
    return this.repo.find();
  }

  async create(data: Partial<UsersEntity>): Promise<UsersEntity> {
    return this.repo.save(data);
  }

  async findById(id: string): Promise<UsersEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<UsersEntity>): Promise<UsersEntity> {
    await this.repo.update({ id }, data);
    const updated = await this.findById(id);

    if (!updated) {
      throw new Error(`User with id ${id} could not be updated`);
    }

    return updated;
  }

  async deactivate(id: string): Promise<UsersEntity> {
    await this.repo.update({ id }, { isActive: false });
    const updated = await this.findById(id);

    if (!updated) {
      throw new Error(`User with id ${id} could not be deactivated`);
    }

    return updated;
  }
}
