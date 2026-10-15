import { Contacts } from './Contacts';
import { MessageContactResponse } from './MessageContactResponse';

export interface IContactsRepository {
  create(data: Contacts): Promise<MessageContactResponse>;
}
