import { Repository } from 'typeorm';
import { IContactsRepository } from '../domain/IContactsRepository';
import { ContactMessagesEntity } from './entities/ContactMessage.entity';

export class ContactsRepositoryTypeORM implements IContactsRepository {
  constructor(private readonly repo: Repository<ContactMessagesEntity>) {}
  async findAll() {
    return this.repo.find();
  }
  async create(data: any) {
    return this.repo.save(data);
  }
}
