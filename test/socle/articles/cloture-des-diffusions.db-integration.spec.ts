import { describeDb } from '../../helpers/base/db-integration-datasource';
import {
  janeEtJohnReserves,
  suiteDeLaDiffusion,
} from '../../helpers/base/diffusion-en-base';

describeDb('Clôture des diffusions (Postgres)', () => {
  const { base, diffusions } = suiteDeLaDiffusion();

  const statutDeLaDiffusion = async (): Promise<string> =>
    (
      await base().query<{ status: string }[]>(
        'SELECT "status" FROM "article_broadcasts"',
      )
    )[0].status;

  it('NL-20 · ne clot pas une diffusion tant qu une reservation reste en attente', async () => {
    const { id, jane, john } = await janeEtJohnReserves(base());
    await diffusions().marquerEnvoye(id, john);

    await diffusions().cloturer(id);
    const pendantLAttente = await statutDeLaDiffusion();
    await diffusions().marquerEnvoye(id, jane);
    await diffusions().cloturer(id);

    expect([pendantLAttente, await statutDeLaDiffusion()]).toEqual([
      'scheduled',
      'sent',
    ]);
  });

  it('NL-20 · clot une diffusion dont l adresse refusee est ecartee, sans la proposer de nouveau', async () => {
    const { id, jane, john } = await janeEtJohnReserves(base());
    await diffusions().marquerRefuse(id, jane);
    await diffusions().marquerEnvoye(id, john);

    await diffusions().cloturer(id);

    expect(await statutDeLaDiffusion()).toBe('sent');
    expect(await diffusions().destinatairesEnAttente(id, 'en', 50)).toEqual([]);
  });
});
