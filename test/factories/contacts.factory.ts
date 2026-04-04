import type { IContactsRepository } from '../../src/modules/contacts/domain/IContacts.repository';
import type { IContactNotifier } from '../../src/modules/contacts/domain/IContactNotifier';
import { Contacts } from '../../src/modules/contacts/domain/Contacts';

/** Construit un objet Contacts domaine avec des valeurs par defaut. */
export function buildContact(overrides?: Partial<Contacts>): Contacts {
  const contact = new Contacts();
  contact.id = 'contact-1';
  contact.email = 'jean@example.com';
  contact.firstName = 'Jean';
  contact.lastName = 'Dupont';
  contact.phone = '+33612345678';
  contact.subject = 'Demande de contact';
  contact.message = 'Bonjour, je souhaite vous contacter pour un projet.';
  contact.role = 'Developpeur';
  contact.terms = true;
  return Object.assign(contact, overrides);
}

/** Cree un mock complet du repository contacts. */
export function createMockContactsRepo(): jest.Mocked<IContactsRepository> {
  return {
    findAll: jest.fn(),
    create: jest.fn(),
  };
}

/** Cree un mock du notifier de contact. */
export function createMockContactNotifier(): jest.Mocked<IContactNotifier> {
  return {
    sendContactNotification: jest.fn(),
  };
}
