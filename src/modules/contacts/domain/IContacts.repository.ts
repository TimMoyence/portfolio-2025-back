import { Contacts } from './Contacts';
import { MessageContactResponse } from './MessageContactResponse';

export interface IContactsRepository {
  findAll(): Promise<Contacts[]>;
  create(data: Contacts): Promise<MessageContactResponse>;
}
