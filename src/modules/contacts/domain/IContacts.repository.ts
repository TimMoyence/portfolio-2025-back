import { Contacts } from './Contacts';
import { MessageContactResponse } from './MessageContactResponse';

/** Port de persistance pour les demandes de contact. */
export interface IContactsRepository {
  findAll(): Promise<Contacts[]>;
  create(data: Contacts): Promise<MessageContactResponse>;
}
