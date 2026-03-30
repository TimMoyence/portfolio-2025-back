import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IContactNotifier } from '../domain/IContactNotifier';
import type { IContactsRepository } from '../domain/IContacts.repository';
import { MessageContactResponse } from '../domain/MessageContactResponse';
import { CONTACT_NOTIFIER, CONTACTS_REPOSITORY } from '../domain/token';
import { CreateContactCommand } from './dto/CreateContact.command';
import { ContactMapper } from './mappers/Contact.mapper';

/** Orchestre la creation d'un contact et l'envoi de notification. */
@Injectable()
export class CreateContactsUseCase {
  private readonly logger = new Logger(CreateContactsUseCase.name);

  constructor(
    @Inject(CONTACTS_REPOSITORY)
    private repo: IContactsRepository,
    @Inject(CONTACT_NOTIFIER)
    private readonly notifier: IContactNotifier,
  ) {}

  async execute(data: CreateContactCommand): Promise<MessageContactResponse> {
    const contact = ContactMapper.fromCreateCommand(data);
    const response = await this.repo.create(contact);

    // Fire-and-forget email notification; log errors without blocking user flow
    void this.notifier
      .sendContactNotification(contact)
      .catch((err: unknown) =>
        this.logger.warn('Contact notification failed', err),
      );

    return response;
  }
}
