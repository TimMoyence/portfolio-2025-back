import request from 'supertest';
import { MESSAGE_DE_LIEN_INVALIDE } from '../../../src/common/domain/errors/auth/LienInvalideError';
import { REPONSES_D_ABONNEMENT } from '../../../src/modules/newsletter/application/SubscribeNewsletter.useCase';
import {
  buildAbonne,
  buildLienDeConfirmation,
} from '../../factories/diffusion/newsletter.factory';
import { applicationDeLaNewsletter } from '../../helpers/http/application-de-la-newsletter';

const JETON = '0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d';
const JETON_DE_CONFIRMATION = 'c'.repeat(64);

describe('Routes de la newsletter servies par le vrai contrôleur', () => {
  const { depot, mailer, serveur } = applicationDeLaNewsletter();

  it('NL-14 · POST /api/newsletter/subscribe repond 202 et le message de tous, la date d acceptation fixee par le serveur', async () => {
    const avant = Date.now();

    const reponse = await request(serveur())
      .post('/api/newsletter/subscribe')
      .send({
        email: 'jane@mail.com',
        locale: 'en',
        termsVersion: '2026-11-12',
      })
      .expect(202);

    expect(reponse.body).toEqual(REPONSES_D_ABONNEMENT.en);
    const [[abonne]] = depot.creer.mock.calls;
    expect(abonne.locale).toBe('en');
    expect(abonne.termsAcceptedAt.getTime()).toBeGreaterThanOrEqual(avant);
    expect(
      mailer.envoyerLaConfirmation.mock.calls.map(([e]) => e.locale),
    ).toEqual(['en']);
  });

  it.each([
    [
      'une langue non servie',
      { email: 'jane@mail.com', locale: 'de', termsVersion: '2026-11-12' },
    ],
    [
      'une adresse invalide',
      { email: 'jane', locale: 'fr', termsVersion: '2026-11-12' },
    ],
    [
      'le piege a robots rempli',
      {
        email: 'jane@mail.com',
        locale: 'fr',
        termsVersion: '2026-11-12',
        website: 'https://spam.test',
      },
    ],
  ])('NL-14 · refuse %s en 400', async (_cas, corps) => {
    await request(serveur())
      .post('/api/newsletter/subscribe')
      .send(corps)
      .expect(400);
    expect(depot.creer.mock.calls).toEqual([]);
  });

  it('NL-14 · POST /api/newsletter/confirm?token= confirme dans la langue du lien', async () => {
    const abonne = buildAbonne();
    depot.trouverParBoite.mockResolvedValue(abonne);
    depot.trouverLeLien.mockResolvedValue(
      buildLienDeConfirmation({
        jeton: JETON_DE_CONFIRMATION,
        boite: abonne.boite,
        locale: 'en',
        expireLe: new Date(Date.now() + 60_000),
      }),
    );

    const reponse = await request(serveur())
      .post(`/api/newsletter/confirm?token=${JETON_DE_CONFIRMATION}`)
      .expect(200);

    expect(reponse.body).toEqual({ status: 'confirmed', locale: 'en' });
  });

  it.each([
    ['inconnu', JETON_DE_CONFIRMATION],
    ['mal forme', 'pas-un-jeton'],
  ])(
    'NL-14 · refuse un lien de confirmation %s en 404, en le disant',
    async (_cas, jeton) => {
      const reponse = await request(serveur())
        .post(`/api/newsletter/confirm?token=${jeton}`)
        .expect(404);

      expect(reponse.body).toMatchObject({
        status: 404,
        detail: MESSAGE_DE_LIEN_INVALIDE,
      });
    },
  );

  it.each([
    ['depuis la page', {}],
    [
      'en un clic depuis le client mail (RFC 8058)',
      'List-Unsubscribe=One-Click',
    ],
  ])(
    'NL-14 · POST /api/newsletter/unsubscribe?token= desabonne %s',
    async (_cas, corps) => {
      const abonne = buildAbonne({
        status: 'confirmed',
        jetonDeDesabonnement: JETON,
      });
      depot.trouverParJetonDeDesabonnement.mockResolvedValue(abonne);
      depot.trouverParBoite.mockResolvedValue(abonne);

      const envoi = request(serveur()).post(
        `/api/newsletter/unsubscribe?token=${JETON}`,
      );
      const reponse = await (
        typeof corps === 'string'
          ? envoi.type('form').send(corps)
          : envoi.send(corps)
      ).expect(200);

      expect(reponse.body).toEqual({ status: 'unsubscribed' });
      expect(depot.mettreAJour.mock.calls).toEqual([
        [{ ...abonne, status: 'unsubscribed' }],
      ]);
    },
  );
});
