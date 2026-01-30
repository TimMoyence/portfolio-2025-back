import { Inject, Injectable } from '@nestjs/common';
import { Contacts } from '../domain/Contacts';
import type { IContactsRepository } from '../domain/IContacts.repository';
import { MessageContactResponse } from '../domain/MessageContactResponse';
import { CONTACTS_REPOSITORY } from '../domain/token';
import { ContactMailerService } from '../infrastructure/ContactMailer.service';
import { ContactMapper } from './mappers/Contact.mapper';

@Injectable()
export class CreateContactsUseCase {
  constructor(
    @Inject(CONTACTS_REPOSITORY)
    private repo: IContactsRepository,
    private readonly contactMailer: ContactMailerService,
  ) {}
  async execute(data: Contacts): Promise<MessageContactResponse> {
    const contact = ContactMapper.fromCreateDto(data);
    const response = await this.repo.create(contact);

    // Fire-and-forget email notification; log errors without blocking user flow
    void this.contactMailer
      .sendContactNotification(contact)
      .catch((err) => console.warn('Contact notification failed', err));

    return response;
  }
}
