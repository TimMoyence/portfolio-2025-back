import { Injectable } from '@nestjs/common';
import { DepotDeRequetes } from '../../../common/infrastructure/typeorm/DepotDeRequetes';
import { Contacts } from '../domain/Contacts';
import { IContactsRepository } from '../domain/IContacts.repository';
import { MessageContactResponse } from '../domain/MessageContactResponse';
import { ContactMessagesEntity } from './entities/ContactMessage.entity';

@Injectable()
export class ContactsRepositoryTypeORM
  extends DepotDeRequetes(ContactMessagesEntity)
  implements IContactsRepository
{
  public async create(data: Contacts): Promise<MessageContactResponse> {
    await this.consigner(
      {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        subject: data.subject,
        message: data.message,
        role: data.role,
        terms: data.terms,
        termsVersion: data.termsVersion,
        termsLocale: data.termsLocale,
        termsMethod: data.termsMethod,
        name: `${data.firstName} ${data.lastName}`.trim(),
        termsAcceptedAt:
          data.termsAcceptedAt ?? (data.terms ? new Date() : undefined),
      },
      data,
    );

    return {
      message: 'Contact message created successfully.',
    };
  }
}
