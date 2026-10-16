import { mockTypeOrmRepository } from '../../../../test/factories/formation-entities.factory';
import { buildLeadMagnetRequest } from '../../../../test/factories/lead-magnet-request.factory';
import type { LeadMagnetRequestEntity } from './entities/LeadMagnetRequest.entity';
import { LeadMagnetRequestRepositoryTypeORM } from './LeadMagnetRequest.repository.typeorm';

const JETON_D_ACCES = '6f1c2a54-9f0e-4c1b-8a7d-3e2b1c0d9e8f';
const CREEE_LE = new Date('2026-04-10T10:00:05Z');

function ligneEnregistree(
  champs: Partial<LeadMagnetRequestEntity>,
): LeadMagnetRequestEntity {
  return {
    ...champs,
    id: 'demande-1',
    accessToken: JETON_D_ACCES,
    createdAt: CREEE_LE,
  } as LeadMagnetRequestEntity;
}

describe('LeadMagnetRequestRepositoryTypeORM', () => {
  const create = jest.fn();
  const save = jest.fn();
  const findOne = jest.fn();
  const sut = new LeadMagnetRequestRepositoryTypeORM(
    mockTypeOrmRepository<LeadMagnetRequestEntity>({ create, save, findOne }),
  );

  beforeEach(() => {
    create
      .mockReset()
      .mockImplementation((champs: Partial<LeadMagnetRequestEntity>) => ({
        ...champs,
      }));
    save
      .mockReset()
      .mockImplementation((ligne: Partial<LeadMagnetRequestEntity>) =>
        Promise.resolve(ligneEnregistree(ligne)),
      );
    findOne.mockReset();
  });

  it('enregistre la demande sans profil sous un profil vide et rend la ligne sauvegardee', async () => {
    const demande = buildLeadMagnetRequest();
    const saisie = {
      firstName: demande.firstName,
      email: demande.email,
      formationSlug: demande.formationSlug,
      termsVersion: demande.termsVersion,
      termsLocale: demande.termsLocale,
      termsAcceptedAt: demande.termsAcceptedAt,
    };

    const enregistree = await sut.create(demande);

    expect(demande.profile).toBeUndefined();
    expect(create).toHaveBeenCalledWith({
      ...saisie,
      boite: 'marie@example.com',
      profile: {},
    });
    expect(save).toHaveBeenCalledWith(create.mock.results[0].value);
    expect({ ...enregistree }).toEqual({
      ...saisie,
      id: 'demande-1',
      accessToken: JETON_D_ACCES,
      profile: {},
      createdAt: CREEE_LE,
    });
  });

  it('persiste la boite de livraison de l adresse, sans sous-adresse ni points Gmail', async () => {
    await sut.create(
      buildLeadMagnetRequest({ email: 'ma.rie+outils@gmail.com' }),
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ma.rie+outils@gmail.com',
        boite: 'marie@gmail.com',
      }),
    );
  });

  it('retrouve une demande par son jeton d acces et la traduit', async () => {
    findOne.mockResolvedValue(
      ligneEnregistree({
        firstName: 'Ada',
        email: 'ada@example.com',
        formationSlug: 'ia-solopreneurs',
        termsVersion: '2026-04-10',
        termsLocale: 'en',
        termsAcceptedAt: CREEE_LE,
        profile: { aiLevel: 'debutant' } as LeadMagnetRequestEntity['profile'],
      }),
    );

    const trouvee = await sut.findByToken(JETON_D_ACCES);

    expect(findOne).toHaveBeenCalledWith({
      where: { accessToken: JETON_D_ACCES },
    });
    expect(trouvee).toMatchObject({
      id: 'demande-1',
      firstName: 'Ada',
      termsLocale: 'en',
      accessToken: JETON_D_ACCES,
      profile: { aiLevel: 'debutant' },
      createdAt: CREEE_LE,
    });
  });

  it('rend null pour un jeton d acces inconnu', async () => {
    findOne.mockResolvedValue(null);

    await expect(sut.findByToken(JETON_D_ACCES)).resolves.toBeNull();
  });
});
