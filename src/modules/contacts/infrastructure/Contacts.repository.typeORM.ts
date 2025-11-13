import { Repository } from 'typeorm';
import { IContactsRepository } from '../domain/IContacts.repository';
import { ContactMessagesEntity } from './entities/ContactMessage.entity';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
@Injectable()
export class ContactsRepositoryTypeORM implements IContactsRepository {
  constructor(
    @InjectRepository(ContactMessagesEntity)
    private readonly repo: Repository<ContactMessagesEntity>,
  ) {}
  async findAll() {
    return this.repo.find();
  }
  async create(data: any) {
    return this.repo.save(data);
  }
}
