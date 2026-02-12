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
    return contacts.map(
      ({
        id,
        email,
        firstName,
        lastName,
        phone,
        subject,
        message,
        role,
        terms,
        termsVersion,
        termsLocale,
        termsAcceptedAt,
        termsMethod,
      }) => ({
        id,
        email,
        firstName,
        lastName,
        phone,
        subject,
        message,
        role,
        terms,
        termsVersion,
        termsLocale,
        termsAcceptedAt,
        termsMethod,
      }),
    );
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
      httpCode: 201,
    };
  }
}
