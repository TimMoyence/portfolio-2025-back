import { describeDb } from '../../helpers/base/db-integration-datasource';
import {
  janeEtJohnReserves,
  suiteDeLaDiffusion,
} from '../../helpers/base/diffusion-en-base';

describeDb('Réservations abandonnées (Postgres)', () => {
  const { base, diffusions } = suiteDeLaDiffusion();

  it('NL-20 · rend aux tours suivants une reservation restee en attente, jamais un envoi fait', async () => {
    const { id, jane } = await janeEtJohnReserves(base());
    await diffusions().marquerEnvoye(id, jane);
    const [{ maintenant }] = await base().query<{ maintenant: Date }[]>(
      'SELECT now() + interval \'1 second\' AS "maintenant"',
    );

    await diffusions().libererLesReservationsAbandonnees(maintenant);

    expect(
      await base().query('SELECT "status" FROM "article_broadcast_recipients"'),
    ).toEqual([{ status: 'sent' }]);
  });

  it('NL-20 · garde une reservation plus recente que le seuil, en cours d envoi', async () => {
    await janeEtJohnReserves(base());

    await diffusions().libererLesReservationsAbandonnees(
      new Date('2000-01-01T00:00:00.000Z'),
    );

    expect(
      await base().query('SELECT 1 FROM "article_broadcast_recipients"'),
    ).toHaveLength(2);
  });
});
