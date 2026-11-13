import { User } from '../../src/modules/users/domain/User';
import { UsersEntity } from '../../src/modules/users/infrastructure/entities/Users.entity';
import { UsersRepositoryTypeORM } from '../../src/modules/users/infrastructure/Users.repository.typeORM';
import {
  baseMigreeDeLaSuite,
  describeDb,
  inscrireUtilisateur,
  TOUTES_LES_ENTITES,
  TOUTES_LES_MIGRATIONS,
} from '../helpers/base/db-integration-datasource';

describeDb('Langue des emails du compte sur une base migrée', () => {
  const base = baseMigreeDeLaSuite(
    [TOUTES_LES_ENTITES],
    [TOUTES_LES_MIGRATIONS],
  );
  const depot = () =>
    new UsersRepositoryTypeORM(base().getRepository(UsersEntity));

  it('CPT-01 · garde la langue choisie a la creation du compte', async () => {
    await depot().create(
      User.create({
        email: 'jane.en@mail.com',
        passwordHash: 'hash',
        firstName: 'Jane',
        lastName: 'Doe',
        locale: 'en',
      }),
    );

    expect((await depot().findByEmail('jane.en@mail.com'))?.locale).toBe('en');
  });

  it('CPT-02 · ecrit en francais a un compte cree avant la langue du compte', async () => {
    await inscrireUtilisateur(base(), 'ancien@mail.com');

    expect((await depot().findByEmail('ancien@mail.com'))?.locale).toBe('fr');
  });
});
