import { Inject } from '@nestjs/common';
import { Contacts } from '../domain/Contacts';
import type { IContactsRepository } from '../domain/IContacts.repository';
import { MessageContactResponse } from '../domain/MessageContactResponse';
import { CONTACTS_REPOSITORY } from '../domain/token';
import { ContactMapper } from './mappers/Contact.mapper';

export class CreateContactsUseCase {
  constructor(
    @Inject(CONTACTS_REPOSITORY)
    private repo: IContactsRepository,
  ) {}
  async execute(data: Contacts): Promise<MessageContactResponse> {
    const contact = ContactMapper.fromCreateDto(data);
    return this.repo.create(contact);
  }
}
