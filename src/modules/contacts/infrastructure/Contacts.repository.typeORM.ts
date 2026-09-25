import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Contacts } from '../domain/Contacts';
import { IContactsRepository } from '../domain/IContacts.repository';
import { MessageContactResponse } from '../domain/MessageContactResponse';
import { ContactMessagesEntity } from './entities/ContactMessage.entity';
@Injectable()
export class ContactsRepositoryTypeORM implements IContactsRepository {
  constructor(
    @InjectRepository(ContactMessagesEntity)
    private readonly repo: Repository<ContactMessagesEntity>,
  ) {}

  async findAll(): Promise<Contacts[]> {
    const contacts = await this.repo.find();
    return contacts.map((contact) => ({
      id: contact.id,
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      subject: contact.subject,
      message: contact.message,
      role: contact.role,
      terms: contact.terms,
      termsVersion: contact.termsVersion,
      termsLocale: contact.termsLocale,
      termsAcceptedAt: contact.termsAcceptedAt,
      termsMethod: contact.termsMethod,
    }));
  }

  public async create(data: Contacts): Promise<MessageContactResponse> {
    const entity = this.repo.create({
      ...data,
      requestId: randomUUID(),
      name: `${data.firstName} ${data.lastName}`.trim(),
      termsAcceptedAt:
        data.termsAcceptedAt ?? (data.terms ? new Date() : undefined),
    });

    await this.repo.save(entity);

    return {
      message: 'Contact message created successfully.',
    };
  }
}
