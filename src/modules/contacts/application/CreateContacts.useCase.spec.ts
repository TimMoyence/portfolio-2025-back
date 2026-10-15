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
import {
  attendreLAvertissement,
  espionnerLesAvertissements,
} from '../../../../test/helpers/avertissements';
import { attendreResultatEtEffetsUniques } from '../../../../test/helpers/effets-uniques';

describe('CreateContactsUseCase', () => {
  let useCase: CreateContactsUseCase;
  let repo: jest.Mocked<IContactsRepository>;
  let notifier: jest.Mocked<IContactNotifier>;
  const avertissements = espionnerLesAvertissements();

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

      attendreResultatEtEffetsUniques(
        result,
        expectedResponse,
        repo.create,
        notifier.sendContactNotification,
      );
    },
  );

  it('journalise la cause d un échec d envoi de la notification', async () => {
    repo.create.mockResolvedValue({ message: 'Contact cree' });
    notifier.sendContactNotification.mockRejectedValue(new Error('smtp down'));

    await useCase.execute(validCommand);

    await attendreLAvertissement(
      avertissements,
      'Contact notification failed: smtp down',
    );
  });
});
