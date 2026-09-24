/* eslint-disable @typescript-eslint/unbound-method */
import { CreateContactsUseCase } from './CreateContacts.useCase';
import type { IContactsRepository } from '../domain/IContacts.repository';
import type { IContactNotifier } from '../domain/IContactNotifier';
import { MessageContactResponse } from '../domain/MessageContactResponse';
import { CreateContactCommand } from './dto/CreateContact.command';
import {
  createMockContactsRepo,
  createMockContactNotifier,
} from '../../../../test/factories/contacts.factory';

describe('CreateContactsUseCase', () => {
  let useCase: CreateContactsUseCase;
  let repo: jest.Mocked<IContactsRepository>;
  let notifier: jest.Mocked<IContactNotifier>;

  const validCommand: CreateContactCommand = {
    email: 'test@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '+33612345678',
    subject: 'Demande de contact',
    message: 'Bonjour, je souhaite vous contacter pour un projet.',
    role: 'Developpeur',
    terms: true,
  };

  beforeEach(() => {
    repo = createMockContactsRepo();
    notifier = createMockContactNotifier();
    useCase = new CreateContactsUseCase(repo, notifier);
  });

  it.each([
    ['envoie la notification', () => Promise.resolve()],
    [
      'survit a l echec de la notification',
      () => Promise.reject(new Error('SMTP error')),
    ],
  ])(
    'devrait creer le contact et %s',
    async (_cas, envoi: () => Promise<void>) => {
      const expectedResponse: MessageContactResponse = {
        message: 'Contact cree',
      };
      repo.create.mockResolvedValue(expectedResponse);
      notifier.sendContactNotification.mockImplementation(envoi);

      const result = await useCase.execute(validCommand);

      expect(result).toEqual(expectedResponse);
      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(notifier.sendContactNotification).toHaveBeenCalledTimes(1);
    },
  );
});
