import { describeDb } from '../../helpers/base/db-integration-datasource';
import {
  articleProgramme,
  ENVOI_PREVU,
  suiteDeLaDiffusion,
} from '../../helpers/base/diffusion-en-base';

const APRES_RESTAURATION = new Date('2026-09-24T10:30:00.000Z');

describeDb('Reprogrammation d une diffusion (Postgres)', () => {
  const { base, diffusions } = suiteDeLaDiffusion();

  const reprogrammerPuisLire = async (id: string): Promise<Date[]> => {
    await diffusions().reprogrammer(id, APRES_RESTAURATION);
    return (
      await base().query<{ send_after: Date }[]>(
        'SELECT "send_after" FROM "article_broadcasts"',
      )
    ).map(({ send_after }) => send_after);
  };

  it('NL-15 · repousse l envoi d une diffusion inachevee a l heure donnee', async () => {
    const id = await articleProgramme(base(), 'fr');

    expect(await reprogrammerPuisLire(id)).toEqual([APRES_RESTAURATION]);
  });

  it('NL-15 · ne relance pas une diffusion entierement envoyee', async () => {
    const id = await articleProgramme(base(), 'fr');
    await base().query(`UPDATE "article_broadcasts" SET "status" = 'sent'`);

    expect(await reprogrammerPuisLire(id)).toEqual([ENVOI_PREVU]);
  });
});
