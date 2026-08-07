import { Contacts } from './Contacts';

export interface IContactNotifier {
  sendContactNotification(contact: Contacts): Promise<void>;
}
