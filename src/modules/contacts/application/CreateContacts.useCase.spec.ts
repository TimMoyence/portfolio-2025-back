/* eslint-disable @typescript-eslint/unbound-method */
import { CreateContactsUseCase } from './CreateContacts.useCase';
import type { IContactsRepository } from '../domain/IContacts.repository';
import type { IContactNotifier } from '../domain/IContactNotifier';
import { MessageContactResponse } from '../domain/MessageContactResponse';
import { CreateContactCommand } from './dto/CreateContact.command';

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
    repo = {
      findAll: jest.fn(),
      create: jest.fn(),
    };
    notifier = {
      sendContactNotification: jest.fn(),
    };
    useCase = new CreateContactsUseCase(repo, notifier);
  });

  it('devrait creer un contact et envoyer la notification', async () => {
    const expectedResponse: MessageContactResponse = {
      message: 'Contact cree',
    };
    repo.create.mockResolvedValue(expectedResponse);
    notifier.sendContactNotification.mockResolvedValue(undefined);

    const result = await useCase.execute(validCommand);

    expect(result).toEqual(expectedResponse);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(notifier.sendContactNotification).toHaveBeenCalledTimes(1);
  });

  it('devrait creer le contact meme si la notification echoue', async () => {
    const expectedResponse: MessageContactResponse = {
      message: 'Contact cree',
    };
    repo.create.mockResolvedValue(expectedResponse);
    notifier.sendContactNotification.mockRejectedValue(new Error('SMTP error'));

    const result = await useCase.execute(validCommand);

    expect(result).toEqual(expectedResponse);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(notifier.sendContactNotification).toHaveBeenCalledTimes(1);
  });
});
