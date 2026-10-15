import type { DeepPartial } from 'typeorm';
import { buildContact } from '../../../../test/factories/contacts.factory';
import { mockTypeOrmRepository } from '../../../../test/factories/formation-entities.factory';
import { ContactsRepositoryTypeORM } from './Contacts.repository.typeORM';
import { ContactMessagesEntity } from './entities/ContactMessage.entity';

function depotDesContacts() {
  const create = jest.fn((valeurs: DeepPartial<ContactMessagesEntity>) => ({
    ...valeurs,
  }));
  const save = jest.fn().mockResolvedValue(undefined);
  const depot = new ContactsRepositoryTypeORM(
    mockTypeOrmRepository<ContactMessagesEntity>({ create, save }),
  );
  return { depot, create, save };
}

describe('ContactsRepositoryTypeORM', () => {
  it('consigne le message avec la provenance de la requête et un identifiant de requête', async () => {
    const { depot, create, save } = depotDesContacts();

    await depot.create(
      buildContact({
        ip: '203.0.113.7',
        userAgent: 'agent-de-test',
        referer: 'https://asilidesign.fr/fr/contact',
      }),
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jean@example.com',
        name: 'Jean Dupont',
        ip: '203.0.113.7',
        userAgent: 'agent-de-test',
        referer: 'https://asilidesign.fr/fr/contact',
        requestId: expect.any(String) as string,
      }),
    );
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('date l acceptation des conditions quand le message ne la porte pas', async () => {
    const { depot, create } = depotDesContacts();

    await depot.create(buildContact({ terms: true }));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ termsAcceptedAt: expect.any(Date) as Date }),
    );
  });
});
