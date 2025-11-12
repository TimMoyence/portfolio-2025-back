import { Contacts } from './Contacts';

export interface IContactsRepository {
  findAll(): Promise<Contacts[]>;
  create(data: Contacts): Promise<Contacts>;
}
