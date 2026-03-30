import { Contacts } from './Contacts';

/** Port de notification pour les demandes de contact. */
export interface IContactNotifier {
  sendContactNotification(contact: Contacts): Promise<void>;
}
