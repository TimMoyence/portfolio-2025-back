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
});
