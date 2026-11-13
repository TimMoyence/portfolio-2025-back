import request from 'supertest';
import { FORME_D_UN_JETON_EMIS } from '../../../src/common/domain/crypto/TokenHash';
import { applicationDeLaNewsletter } from '../../helpers/http/application-de-la-newsletter';

const JETON_EN_UUID = '0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d';

describe('Forme des jetons de la newsletter', () => {
  const { depot, mailer, serveur } = applicationDeLaNewsletter();

  it('NL-08 · emet le jeton de confirmation a la forme commune des liens du produit', async () => {
    await request(serveur())
      .post('/api/newsletter/subscribe')
      .send({
        email: 'jane@mail.com',
        locale: 'fr',
        termsVersion: '2026-11-12',
      })
      .expect(202);

    const jetons = mailer.envoyerLaConfirmation.mock.calls.map(
      ([envoi]) => envoi.jeton,
    );
    expect(jetons).toHaveLength(1);
    expect(jetons[0]).toMatch(FORME_D_UN_JETON_EMIS);
  });

  it('NL-03 · refuse a l entree un jeton de confirmation d une autre forme, sans interroger la base', async () => {
    await request(serveur())
      .post('/api/newsletter/confirm')
      .query({ token: JETON_EN_UUID })
      .expect(404);

    expect(depot.trouverLeLien.mock.calls).toEqual([]);
  });

  it.each([
    ['depuis la page', {}],
    ['en un clic', 'List-Unsubscribe=One-Click'],
  ])(
    'NL-13 · refuse a l entree un jeton de desabonnement qui n est pas un uuid, %s, sans interroger la base',
    async (_cas, corps) => {
      const envoi = request(serveur()).post(
        '/api/newsletter/unsubscribe?token=pas-un-jeton',
      );
      await (
        typeof corps === 'string'
          ? envoi.type('form').send(corps)
          : envoi.send(corps)
      ).expect(404);

      expect(depot.trouverParJetonDeDesabonnement.mock.calls).toEqual([]);
    },
  );
});
