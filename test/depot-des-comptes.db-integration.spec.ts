import { CompteDejaInscritError } from '../src/modules/users/domain/CompteDejaInscritError';
import { UsersEntity } from '../src/modules/users/infrastructure/entities/Users.entity';
import { UsersRepositoryTypeORM } from '../src/modules/users/infrastructure/Users.repository.typeORM';
import {
  baseMigreeDeLaSuite,
  describeDb,
  inscrireUtilisateur,
  TOUTES_LES_ENTITES,
  TOUTES_LES_MIGRATIONS,
} from './helpers/db-integration-datasource';

describeDb('Depot des comptes sur une base migree', () => {
  const base = baseMigreeDeLaSuite(
    [TOUTES_LES_ENTITES],
    [TOUTES_LES_MIGRATIONS],
  );
  let userId: string;

  beforeAll(async () => {
    userId = await inscrireUtilisateur(base(), 'casse@example.com');
  });

  it.each([
    ['casse@example.com'],
    ['Casse@Example.COM'],
    ['CASSE@EXAMPLE.COM'],
  ])('retrouve le compte inscrit par l adresse saisie %p', async (saisie) => {
    const depot = new UsersRepositoryTypeORM(base().getRepository(UsersEntity));

    await expect(depot.findByEmail(saisie)).resolves.toMatchObject({
      id: userId,
      email: 'casse@example.com',
    });
  });

  it.each([['autre@example.com'], ['pas une adresse']])(
    'ne retrouve aucun compte pour %p',
    async (saisie) => {
      const depot = new UsersRepositoryTypeORM(
        base().getRepository(UsersEntity),
      );

      await expect(depot.findByEmail(saisie)).resolves.toBeNull();
    },
  );

  describe('adresse ou compte Google deja pris', () => {
    const depot = () =>
      new UsersRepositoryTypeORM(base().getRepository(UsersEntity));

    it('refuse un second compte a la meme adresse par un conflit de compte deja inscrit', async () => {
      await expect(
        depot().create({
          email: 'casse@example.com',
          firstName: 'Second',
          lastName: 'Compte',
        }),
      ).rejects.toBeInstanceOf(CompteDejaInscritError);
    });

    it('refuse de donner a un compte l adresse d un autre par un conflit de compte deja inscrit', async () => {
      const second = await inscrireUtilisateur(base(), 'second@example.com');

      await expect(
        depot().update(second, { email: 'casse@example.com' }),
      ).rejects.toBeInstanceOf(CompteDejaInscritError);
      await expect(depot().findById(second)).resolves.toMatchObject({
        email: 'second@example.com',
      });
    });

    it('refuse de lier a un compte le compte Google d un autre par un conflit de compte deja inscrit', async () => {
      const lie = await inscrireUtilisateur(base(), 'lie@example.com');
      const intrus = await inscrireUtilisateur(base(), 'intrus@example.com');
      await depot().update(lie, { googleId: 'google-pris' });

      await expect(
        depot().update(intrus, { googleId: 'google-pris' }),
      ).rejects.toBeInstanceOf(CompteDejaInscritError);
    });
  });
});
