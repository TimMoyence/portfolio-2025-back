import { Inject, Injectable, Logger } from '@nestjs/common';
import { enArrierePlan } from '../../../common/application/en-arriere-plan';
import type { IContactNotifier } from '../domain/IContactNotifier';
import type { IContactsRepository } from '../domain/IContacts.repository';
import { MessageContactResponse } from '../domain/MessageContactResponse';
import { CONTACT_NOTIFIER, CONTACTS_REPOSITORY } from '../domain/token';
import { CreateContactCommand } from './dto/CreateContact.command';
import { ContactMapper } from './mappers/Contact.mapper';

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

    enArrierePlan(
      this.notifier.sendContactNotification(contact),
      'Contact notification failed',
      this.logger,
    );

    return response;
  }
}
